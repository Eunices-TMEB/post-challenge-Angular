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
    'x-rapidapi-key': 'ef882c9dfbmsh85948ef87308752p17141bjsna15055870fb9'
  });
  
  // Caché en MEMORIA (no storage) - se borra con F5
  private moviesCache: Movie[] | null = null;
  private seriesCache: Movie[] | null = null;

  constructor(
    private http: HttpClient,
    private translationService: TranslationService
  ) { }

  getTop100Movies(): Observable<Movie[]> {
    // Si ya hay datos en el caché de memoria, devolverlos
    if (this.moviesCache && this.moviesCache.length > 0) {
      console.log('Cargando películas desde caché en memoria:', this.moviesCache.length, 'películas');
      return of([...this.moviesCache]); // Devolver copia
    }

    // Si no hay caché, consultar la API
    console.log('No hay películas en caché, consultando API...');
    return this.http.get<Movie[]>(this.moviesApiUrl, { headers: this.headers })
      .pipe(
        map(movies => this.translateMovies(movies)),
        tap(movies => {
          console.log('Películas recibidas y traducidas de la API:', movies.length, 'películas');
          // Guardar en caché de memoria
          this.moviesCache = [...movies];
        }),
        catchError(this.handleError)
      );
  }

  getTop100Series(): Observable<Movie[]> {
    // Si ya hay datos en el caché de memoria, devolverlos
    if (this.seriesCache && this.seriesCache.length > 0) {
      console.log('Cargando series desde caché en memoria:', this.seriesCache.length, 'series');
      return of([...this.seriesCache]); // Devolver copia
    }

    // Si no hay caché, consultar la API
    console.log('No hay series en caché, consultando API...');
    return this.http.get<Movie[]>(this.seriesApiUrl, { headers: this.headers })
      .pipe(
        map(series => this.translateMovies(series)),
        tap(series => {
          console.log('Series recibidas y traducidas de la API:', series.length, 'series');
          // Guardar en caché de memoria
          this.seriesCache = [...series];
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

  // Update a movie or series (actualiza el caché en MEMORIA)
  updateMovie(movie: Movie, type: 'movies' | 'series' = 'movies'): Observable<Movie> {
    // Actualizar en el caché de memoria
    const cache = type === 'movies' ? this.moviesCache : this.seriesCache;
    
    if (cache && cache.length > 0) {
      const index = cache.findIndex(m => m.id === movie.id);
      if (index !== -1) {
        cache[index] = movie;
        console.log(`${type} actualizada en caché de memoria:`, movie.title);
      }
    }
    
    return of(movie);
  }

  // Delete a movie or series (actualiza el caché en MEMORIA)
  deleteMovie(id: string, type: 'movies' | 'series' = 'movies'): Observable<boolean> {
    // Eliminar del caché de memoria
    if (type === 'movies' && this.moviesCache) {
      this.moviesCache = this.moviesCache.filter(m => m.id !== id);
      console.log(`Película eliminada del caché de memoria, ID:`, id);
    } else if (type === 'series' && this.seriesCache) {
      this.seriesCache = this.seriesCache.filter(m => m.id !== id);
      console.log(`Serie eliminada del caché de memoria, ID:`, id);
    }
    
    return of(true);
  }

  // Get a single movie or series by ID with type specification
  getMovieById(id: string, type: 'movie' | 'series' = 'movie'): Observable<Movie | null> {
    console.log(`Buscando ${type} con ID: ${id}`);
    
    // Determinar qué caché y API usar según el tipo
    const cache = type === 'movie' ? this.moviesCache : this.seriesCache;
    const apiUrl = type === 'movie' ? this.moviesApiUrl : this.seriesApiUrl;
    
    // Buscar en caché de memoria del tipo especificado
    if (cache && cache.length > 0) {
      const found = cache.find(m => m.id === id);
      if (found) {
        console.log(`${type === 'movie' ? 'Película' : 'Serie'} encontrada en caché de memoria:`, found.title);
        return of(found);
      }
    }
    
    // Si no hay datos en caché, consultar la API específica
    console.log(`No se encontró en caché, consultando API de ${type}...`);
    return this.http.get<Movie[]>(apiUrl, { headers: this.headers })
      .pipe(
        map(items => {
          const translated = this.translateMovies(items);
          // Guardar en el caché de memoria
          if (type === 'movie') {
            this.moviesCache = [...translated];
          } else {
            this.seriesCache = [...translated];
          }
          const found = translated.find(m => m.id === id);
          
          if (found) {
            console.log(`${type === 'movie' ? 'Película' : 'Serie'} encontrada en API:`, found.title);
          } else {
            console.log(`No se encontró ${type} con ID ${id}`);
          }
          
          return found || null;
        }),
        catchError((error) => {
          console.error(`Error cargando ${type}:`, error);
          return of(null);
        })
      );
  }

  // Reset to original data from API (limpia el caché y vuelve a cargar)
  resetToOriginal(type: 'movies' | 'series' = 'movies'): Observable<Movie[]> {
    // Limpiar el caché de memoria para forzar una recarga desde la API
    if (type === 'movies') {
      this.moviesCache = null;
    } else {
      this.seriesCache = null;
    }
    
    // Volver a cargar desde la API
    const apiUrl = type === 'movies' ? this.moviesApiUrl : this.seriesApiUrl;
    return this.http.get<Movie[]>(apiUrl, { headers: this.headers })
      .pipe(
        map(items => this.translateMovies(items)),
        tap(items => {
          // Guardar en el caché de memoria
          if (type === 'movies') {
            this.moviesCache = [...items];
          } else {
            this.seriesCache = [...items];
          }
        }),
        catchError(this.handleError)
      );
  }

  // Private helper methods

  private handleError(error: any): Observable<never> {
    console.error('Ha ocurrido un error:', error);
    return throwError(() => new Error('Algo salió mal. Por favor, intenta de nuevo más tarde.'));
  }
}

