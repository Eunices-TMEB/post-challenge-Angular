import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError, of, tap, map } from 'rxjs';
import { Movie } from '../models/movie.model';
import { TranslationService } from './translation.service';

@Injectable({
  providedIn: 'root'
})
export class MoviesService {
  private moviesApiUrl = 'https://imdb-top-100-movies.p.rapidapi.com/';
  private seriesApiUrl = 'https://imdb-top-100-movies.p.rapidapi.com/series/';
  private headers = new HttpHeaders({
    'x-rapidapi-host': 'imdb-top-100-movies.p.rapidapi.com',
    'x-rapidapi-key': '483af54051mshed5f6a0686e140bp1917c6jsn6bf4eec07bfa'
  });
  
  private moviesCache: Movie[] | null = null;
  private seriesCache: Movie[] | null = null;
  
  private originalMoviesCache: Movie[] | null = null;
  private originalSeriesCache: Movie[] | null = null;
  
  private loadingMovies = false;
  private loadingSeries = false;

  constructor(
    private http: HttpClient,
    private translationService: TranslationService
  ) { }

  getTop100Movies(): Observable<Movie[]> {
    if (this.moviesCache && this.moviesCache.length > 0) {
      return of([...this.moviesCache]);
    }

    if (this.loadingMovies) {
      return of([]);
    }

    this.loadingMovies = true;
    
    return this.http.get<any[]>(this.moviesApiUrl, { headers: this.headers })
      .pipe(
        map(movies => this.translateMovies(movies)),
        tap(movies => {
          this.moviesCache = [...movies];
          this.originalMoviesCache = [...movies];
          this.loadingMovies = false;
        }),
        catchError((error) => {
          this.loadingMovies = false;
          return this.handleError(error);
        })
      );
  }

  getTop100Series(): Observable<Movie[]> {
    if (this.seriesCache && this.seriesCache.length > 0) {
      return of([...this.seriesCache]);
    }

    if (this.loadingSeries) {
      return of([]);
    }

    this.loadingSeries = true;
    
    return this.http.get<any[]>(this.seriesApiUrl, { headers: this.headers })
      .pipe(
        map(series => this.translateMovies(series)),
        tap(series => {
          this.seriesCache = [...series];
          this.originalSeriesCache = [...series];
          this.loadingSeries = false;
        }),
        catchError((error) => {
          this.loadingSeries = false;
          return this.handleError(error);
        })
      );
  }

  private translateMovies(movies: Movie[]): Movie[] {
    return movies.map(movie => ({
      ...movie,
      title: this.translationService.translateTitle(movie.title),
      genre: this.translationService.translateGenres(movie.genre)
    }));
  }

  createMovie(movie: Movie): Observable<Movie> {
    movie.rank = Date.now();
    movie.id = `custom_${Date.now()}`;
    movie.imdbid = movie.id;
    
    return of(movie);
  }

  updateMovie(movie: Movie, type: 'movies' | 'series' = 'movies'): Observable<Movie> {
    const cache = type === 'movies' ? this.moviesCache : this.seriesCache;
    
    if (cache && cache.length > 0) {
      const index = cache.findIndex(m => m.id === movie.id);
      if (index !== -1) {
        cache[index] = movie;
      }
    }
    
    return of(movie);
  }

  deleteMovie(id: string, type: 'movies' | 'series' = 'movies'): Observable<boolean> {
    if (type === 'movies' && this.moviesCache) {
      this.moviesCache = this.moviesCache.filter(m => m.id !== id);
    } else if (type === 'series' && this.seriesCache) {
      this.seriesCache = this.seriesCache.filter(m => m.id !== id);
    }
    
    return of(true);
  }

  getMovieById(id: string, type: 'movie' | 'series' = 'movie'): Observable<Movie | null> {
    const cache = type === 'movie' ? this.moviesCache : this.seriesCache;
    
    if (cache && cache.length > 0) {
      const found = cache.find(m => m.id === id);
      if (found) {
        return of(found);
      }
    }
    
    const loadObservable = type === 'movie' ? this.getTop100Movies() : this.getTop100Series();
    
    return loadObservable.pipe(
      map(items => items.find(m => m.id === id) || null),
      catchError(() => of(null))
    );
  }

  resetToOriginal(type: 'movies' | 'series' = 'movies'): Observable<Movie[]> {
    if (type === 'movies') {
      if (this.originalMoviesCache && this.originalMoviesCache.length > 0) {
        this.moviesCache = [...this.originalMoviesCache];
        return of([...this.moviesCache]);
      }
      return of([]);
    } else {
      if (this.originalSeriesCache && this.originalSeriesCache.length > 0) {
        this.seriesCache = [...this.originalSeriesCache];
        return of([...this.seriesCache]);
      }
      return of([]);
    }
  }

  private handleError(error: any): Observable<never> {
    return throwError(() => new Error('Algo salió mal. Por favor, intenta de nuevo más tarde.'));
  }
}

