import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError, of, tap, map } from 'rxjs';
import { Movie } from '../models/movie.model';
import { TranslationService } from './translation.service';

@Injectable({
  providedIn: 'root'
})
export class MoviesService {
  private apiUrl = 'https://imdb-top-100-movies.p.rapidapi.com/';
  private headers = new HttpHeaders({
    'x-rapidapi-host': 'imdb-top-100-movies.p.rapidapi.com',
    'x-rapidapi-key': 'ef882c9dfbmsh85948ef87308752p17141bjsna15055870fb9'
  });
  private readonly STORAGE_KEY = 'imdb_movies';
  private readonly ORIGINAL_DATA_KEY = 'imdb_movies_original';

  constructor(
    private http: HttpClient,
    private translationService: TranslationService
  ) { }

  getTop100Movies(): Observable<Movie[]> {
    // Check if we have data in localStorage
    const storedMovies = this.getFromLocalStorage();
    if (storedMovies && storedMovies.length > 0) {
      console.log('Cargando películas desde localStorage:', storedMovies.length, 'películas');
      console.log('Primera película desde localStorage:', storedMovies[0]);
      return of(storedMovies);
    }

    // If not, fetch from API
    console.log('No hay datos en localStorage, consultando API...');
    return this.http.get<Movie[]>(this.apiUrl, { headers: this.headers })
      .pipe(
        map(movies => this.translateMovies(movies)),
        tap(movies => {
          console.log('Películas recibidas y traducidas de la API:', movies.length, 'películas');
          console.log('Primera película traducida:', movies[0]);
          // Save original data and current data to localStorage
          this.saveToLocalStorage(movies);
          this.saveOriginalData(movies);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Traduce los datos de las películas al español
   */
  private translateMovies(movies: Movie[]): Movie[] {
    return movies.map(movie => ({
      ...movie,
      title: this.translationService.translateTitle(movie.title),
      genre: this.translationService.translateGenres(movie.genre)
    }));
  }

  // Create a new movie
  createMovie(movie: Movie): Observable<Movie> {
    const movies = this.getFromLocalStorage() || [];
    
    // Generate new rank and id
    const maxRank = movies.length > 0 ? Math.max(...movies.map(m => m.rank)) : 0;
    movie.rank = maxRank + 1;
    movie.id = `custom_${Date.now()}`;
    movie.imdbid = movie.id;
    
    movies.push(movie);
    this.saveToLocalStorage(movies);
    
    return of(movie);
  }

  // Update a movie
  updateMovie(movie: Movie): Observable<Movie> {
    const movies = this.getFromLocalStorage() || [];
    const index = movies.findIndex(m => m.id === movie.id);
    
    if (index !== -1) {
      movies[index] = movie;
      this.saveToLocalStorage(movies);
      return of(movie);
    }
    
    return throwError(() => new Error('Movie not found'));
  }

  // Delete a movie
  deleteMovie(id: string): Observable<boolean> {
    const movies = this.getFromLocalStorage() || [];
    const filteredMovies = movies.filter(m => m.id !== id);
    
    if (filteredMovies.length < movies.length) {
      this.saveToLocalStorage(filteredMovies);
      return of(true);
    }
    
    return of(false);
  }

  // Reset to original data from API
  resetToOriginal(): Observable<Movie[]> {
    const originalData = this.getOriginalData();
    if (originalData && originalData.length > 0) {
      this.saveToLocalStorage(originalData);
      return of(originalData);
    }
    
    // If no original data, fetch from API again
    return this.http.get<Movie[]>(this.apiUrl, { headers: this.headers })
      .pipe(
        map(movies => this.translateMovies(movies)),
        tap(movies => {
          this.saveToLocalStorage(movies);
          this.saveOriginalData(movies);
        }),
        catchError(this.handleError)
      );
  }

  // Clear all data
  clearLocalStorage(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Private helper methods
  private saveToLocalStorage(movies: Movie[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(movies));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  private getFromLocalStorage(): Movie[] | null {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  }

  private saveOriginalData(movies: Movie[]): void {
    try {
      // Only save if not already saved
      if (!localStorage.getItem(this.ORIGINAL_DATA_KEY)) {
        localStorage.setItem(this.ORIGINAL_DATA_KEY, JSON.stringify(movies));
      }
    } catch (error) {
      console.error('Error saving original data:', error);
    }
  }

  private getOriginalData(): Movie[] | null {
    try {
      const data = localStorage.getItem(this.ORIGINAL_DATA_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error reading original data:', error);
      return null;
    }
  }

  private handleError(error: any): Observable<never> {
    console.error('Ha ocurrido un error:', error);
    return throwError(() => new Error('Algo salió mal. Por favor, intenta de nuevo más tarde.'));
  }
}

