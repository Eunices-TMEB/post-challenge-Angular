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
  private readonly ORIGINAL_DATA_KEY = 'imdb_movies_original';

  constructor(
    private http: HttpClient,
    private translationService: TranslationService
  ) { }

  getTop100Movies(): Observable<Movie[]> {
    // Siempre restaura datos originales al cargar
    // Esto asegura que al hacer F5, los datos vuelven a su estado inicial
    const originalData = this.getOriginalData();
    
    if (originalData && originalData.length > 0) {
      console.log('Cargando datos originales desde caché:', originalData.length, 'películas');
      return of(originalData);
    }

    // Si no hay datos originales guardados, consultar la API
    console.log('No hay datos en caché, consultando API...');
    return this.http.get<Movie[]>(this.apiUrl, { headers: this.headers })
      .pipe(
        map(movies => this.translateMovies(movies)),
        tap(movies => {
          console.log('Películas recibidas y traducidas de la API:', movies.length, 'películas');
          console.log('Primera película traducida:', movies[0]);
          // Solo guarda los datos originales (no guarda cambios en localStorage)
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

  // Create a new movie (solo en memoria, no persiste en localStorage)
  createMovie(movie: Movie): Observable<Movie> {
    // Generate new rank and id
    movie.rank = Date.now(); // Usamos timestamp como rank único
    movie.id = `custom_${Date.now()}`;
    movie.imdbid = movie.id;
    
    return of(movie);
  }

  // Update a movie (solo en memoria, no persiste en localStorage)
  updateMovie(movie: Movie): Observable<Movie> {
    // Simplemente retorna la película actualizada
    // El componente maneja la actualización en su array local
    return of(movie);
  }

  // Delete a movie (solo en memoria, no persiste en localStorage)
  deleteMovie(id: string): Observable<boolean> {
    // Simplemente retorna true
    // El componente maneja la eliminación en su array local
    return of(true);
  }

  // Reset to original data from API
  resetToOriginal(): Observable<Movie[]> {
    const originalData = this.getOriginalData();
    if (originalData && originalData.length > 0) {
      return of(originalData);
    }
    
    // If no original data, fetch from API again
    return this.http.get<Movie[]>(this.apiUrl, { headers: this.headers })
      .pipe(
        map(movies => this.translateMovies(movies)),
        tap(movies => {
          this.saveOriginalData(movies);
        }),
        catchError(this.handleError)
      );
  }

  // Clear all data (limpia solo los datos originales del caché)
  clearLocalStorage(): void {
    localStorage.removeItem(this.ORIGINAL_DATA_KEY);
  }

  // Private helper methods

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

