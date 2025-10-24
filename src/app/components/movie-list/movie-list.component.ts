import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MoviesService } from '../../services/movies.service';
import { Movie } from '../../models/movie.model';
import { MovieFormDialogComponent } from '../movie-form-dialog/movie-form-dialog.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-movie-list',
  templateUrl: './movie-list.component.html',
  styleUrls: ['./movie-list.component.scss']
})
export class MovieListComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  movies: Movie[] = [];
  series: Movie[] = [];
  filteredMovies: Movie[] = [];
  paginatedMovies: Movie[] = [];
  dataSource: MatTableDataSource<Movie> = new MatTableDataSource<Movie>([]);
  
  loading: boolean = true;
  error: string = '';
  searchTerm: string = '';
  currentTab: 'movies' | 'series' = 'movies';
  private readonly TAB_STORAGE_KEY = 'current_tab';
  
  // Vista: 'grid' o 'table'
  viewMode: 'grid' | 'table' = 'grid';
  
  // Paginación
  pageSize: number = 12;
  pageIndex: number = 0;
  pageSizeOptions: number[] = [12, 24, 48, 100];
  totalItems: number = 0;
  
  // Columnas de la tabla
  displayedColumns: string[] = ['rank', 'title', 'year', 'rating', 'genre', 'director', 'actions'];
  
  // Exponer Math para el template
  Math = Math;

  constructor(
    private moviesService: MoviesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Restaurar el tab guardado ANTES de cargar datos
    const savedTab = sessionStorage.getItem(this.TAB_STORAGE_KEY) as 'movies' | 'series' | null;
    if (savedTab) {
      this.currentTab = savedTab;
    }
    
    // Cargar ambos conjuntos de datos de manera coordinada
    this.loadAllData();
  }

  ngAfterViewInit(): void {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  loadAllData(): void {
    this.loading = true;
    
    forkJoin({
      movies: this.moviesService.getTop100Movies(),
      series: this.moviesService.getTop100Series()
    }).subscribe({
      next: (result) => {
        console.log('Películas cargadas:', result.movies.length);
        console.log('Series cargadas:', result.series.length);
        
        this.movies = result.movies;
        this.series = result.series;
        
        // Mostrar los datos del tab activo
        const activeData = this.currentTab === 'movies' ? this.movies : this.series;
        this.filteredMovies = activeData;
        this.totalItems = activeData.length;
        this.dataSource.data = activeData;
        this.updatePaginatedMovies();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar los datos. Por favor, intenta de nuevo más tarde.';
        this.loading = false;
        console.error('Error loading data:', error);
      }
    });
  }

  loadMovies(): void {
    this.loading = true;
    this.moviesService.getTop100Movies().subscribe({
      next: (data) => {
        console.log('Películas recargadas:', data);
        this.movies = data;
        if (this.currentTab === 'movies') {
          this.filteredMovies = data;
          this.totalItems = data.length;
          this.dataSource.data = data;
          this.updatePaginatedMovies();
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar las películas. Por favor, intenta de nuevo más tarde.';
        this.loading = false;
        console.error('Error loading movies:', error);
      }
    });
  }

  loadSeries(): void {
    this.loading = true;
    this.moviesService.getTop100Series().subscribe({
      next: (data) => {
        console.log('Series recargadas:', data);
        this.series = data;
        if (this.currentTab === 'series') {
          this.filteredMovies = data;
          this.totalItems = data.length;
          this.dataSource.data = data;
          this.updatePaginatedMovies();
        }
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar las series. Por favor, intenta de nuevo más tarde.';
        this.loading = false;
        console.error('Error loading series:', error);
      }
    });
  }

  onTabChange(tab: 'movies' | 'series'): void {
    this.currentTab = tab;
    // Guardar el tab actual en sessionStorage
    sessionStorage.setItem(this.TAB_STORAGE_KEY, tab);
    
    this.searchTerm = '';
    this.pageIndex = 0;
    
    const data = tab === 'movies' ? this.movies : this.series;
    this.filteredMovies = data;
    this.totalItems = data.length;
    this.dataSource.data = data;
    this.updatePaginatedMovies();
  }
  
  toggleView(mode: 'grid' | 'table'): void {
    this.viewMode = mode;
    // Reiniciar a la primera página al cambiar de vista
    this.pageIndex = 0;
    this.updatePaginatedMovies();
  }
  
  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.pageIndex = event.pageIndex;
    this.updatePaginatedMovies();
  }
  
  updatePaginatedMovies(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedMovies = this.filteredMovies.slice(startIndex, endIndex);
    this.totalItems = this.filteredMovies.length;
  }

  onSearch(): void {
    const sourceData = this.currentTab === 'movies' ? this.movies : this.series;
    
    if (!this.searchTerm.trim()) {
      this.filteredMovies = sourceData;
      this.dataSource.data = sourceData;
      this.pageIndex = 0;
      this.updatePaginatedMovies();
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredMovies = sourceData.filter(movie =>
      movie.title.toLowerCase().includes(term) ||
      movie.description.toLowerCase().includes(term) ||
      movie.genre.some(g => g.toLowerCase().includes(term))
    );
    
    this.dataSource.data = this.filteredMovies;
    this.pageIndex = 0;
    this.updatePaginatedMovies();
  }

  clearSearch(): void {
    this.searchTerm = '';
    const sourceData = this.currentTab === 'movies' ? this.movies : this.series;
    this.filteredMovies = sourceData;
    this.dataSource.data = sourceData;
    this.pageIndex = 0;
    this.updatePaginatedMovies();
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(MovieFormDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { movie: null },
      disableClose: false,
      panelClass: 'movie-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.createMovie(result);
      }
    });
  }

  openEditDialog(movie: Movie): void {
    const dialogRef = this.dialog.open(MovieFormDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { movie: { ...movie } },
      disableClose: false,
      panelClass: 'movie-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.updateMovie(result);
      }
    });
  }

  createMovie(movie: Movie): void {
    this.moviesService.createMovie(movie).subscribe({
      next: (newMovie) => {
        // Agregar al array correspondiente
        if (this.currentTab === 'movies') {
          this.movies.push(newMovie);
          this.filteredMovies = [...this.movies];
        } else {
          this.series.push(newMovie);
          this.filteredMovies = [...this.series];
        }
        this.dataSource.data = this.filteredMovies;
        this.updatePaginatedMovies();
        const tipo = this.currentTab === 'movies' ? 'Película' : 'Serie';
        this.showSnackBar(`¡${tipo} creada exitosamente! 🎬`, 'success');
      },
      error: (error) => {
        const tipo = this.currentTab === 'movies' ? 'película' : 'serie';
        this.showSnackBar(`Error al crear la ${tipo}. Por favor, intenta de nuevo.`, 'error');
        console.error('Error creating:', error);
      }
    });
  }

  updateMovie(movie: Movie): void {
    const tipo = this.currentTab === 'movies' ? 'Película' : 'Serie';
    const tipoLower = tipo.toLowerCase();
    
    // Pasar el tipo al servicio para actualizar el localStorage correcto
    this.moviesService.updateMovie(movie, this.currentTab).subscribe({
      next: () => {
        // Actualizar en el array correspondiente
        const sourceData = this.currentTab === 'movies' ? this.movies : this.series;
        const index = sourceData.findIndex(m => m.id === movie.id);
        if (index !== -1) {
          sourceData[index] = movie;
          this.filteredMovies = [...sourceData];
          this.dataSource.data = this.filteredMovies;
          this.updatePaginatedMovies();
          // Re-aplicar búsqueda si hay filtro activo
          if (this.searchTerm) {
            this.onSearch();
          }
        }
        this.showSnackBar(`¡${tipo} actualizada exitosamente! ✏️`, 'success');
      },
      error: (error) => {
        this.showSnackBar(`Error al actualizar la ${tipoLower}. Por favor, intenta de nuevo.`, 'error');
        console.error('Error updating:', error);
      }
    });
  }

  onDeleteMovie(movie: Movie): void {
    const tipo = this.currentTab === 'movies' ? 'Película' : 'Serie';
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      data: {
        title: `Eliminar ${tipo}`,
        message: `¿Estás seguro de que deseas eliminar "${movie.title}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Pasar el tipo al servicio para actualizar el localStorage correcto
        this.moviesService.deleteMovie(movie.id, this.currentTab).subscribe({
          next: (success) => {
            if (success) {
              // Eliminar del array correspondiente
              if (this.currentTab === 'movies') {
                this.movies = this.movies.filter(m => m.id !== movie.id);
                this.filteredMovies = [...this.movies];
              } else {
                this.series = this.series.filter(m => m.id !== movie.id);
                this.filteredMovies = [...this.series];
              }
              this.dataSource.data = this.filteredMovies;
              this.updatePaginatedMovies();
              // Re-aplicar búsqueda si hay filtro activo
              if (this.searchTerm) {
                this.onSearch();
              }
              this.showSnackBar(`¡${tipo} eliminada exitosamente! 🗑️`, 'success');
            } else {
              const tipoLower = tipo.toLowerCase();
              this.showSnackBar(`Error al eliminar la ${tipoLower}. Por favor, intenta de nuevo.`, 'error');
            }
          },
          error: (error) => {
            const tipoLower = tipo.toLowerCase();
            this.showSnackBar(`Error al eliminar la ${tipoLower}. Por favor, intenta de nuevo.`, 'error');
            console.error('Error deleting:', error);
          }
        });
      }
    });
  }

  resetToOriginal(): void {
    const tipo = this.currentTab === 'movies' ? 'películas' : 'series';
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      data: {
        title: 'Restaurar Datos Originales',
        message: `¿Estás seguro de que deseas restaurar todas las ${tipo} a su estado original? Todos los cambios se perderán.`,
        confirmText: 'Restaurar',
        cancelText: 'Cancelar',
        type: 'warning'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading = true;
        this.moviesService.resetToOriginal(this.currentTab).subscribe({
          next: (data) => {
            if (this.currentTab === 'movies') {
              this.movies = data;
            } else {
              this.series = data;
            }
            this.filteredMovies = data;
            this.dataSource.data = data;
            this.pageIndex = 0;
            this.updatePaginatedMovies();
            this.loading = false;
            this.showSnackBar('¡Datos restaurados exitosamente! 🔄', 'success');
          },
          error: (error) => {
            this.error = 'Error al restaurar los datos. Por favor, intenta de nuevo.';
            this.loading = false;
            this.showSnackBar('Error al restaurar los datos. Por favor, intenta de nuevo.', 'error');
            console.error('Error resetting data:', error);
          }
        });
      }
    });
  }

  clearAndReload(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      data: {
        title: 'Limpiar Caché',
        message: '¿Estás seguro de que deseas limpiar el caché y recargar los datos desde la API?',
        confirmText: 'Limpiar',
        cancelText: 'Cancelar',
        type: 'warning'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading = true;
        localStorage.clear();
        this.showSnackBar('Caché limpiado. Recargando datos...', 'success');
        
        // Reload from API
        this.moviesService.getTop100Movies().subscribe({
          next: (data) => {
            this.movies = data;
            this.filteredMovies = data;
            this.dataSource.data = data;
            this.pageIndex = 0;
            this.updatePaginatedMovies();
            this.loading = false;
            this.showSnackBar('¡Datos recargados exitosamente desde la API! 🎬', 'success');
          },
          error: (error) => {
            this.error = 'Error al cargar los datos. Por favor, intenta de nuevo.';
            this.loading = false;
            this.showSnackBar('Error al cargar los datos. Por favor, intenta de nuevo.', 'error');
            console.error('Error loading data:', error);
          }
        });
      }
    });
  }

  getGenresString(genres: string[]): string {
    return genres.join(', ');
  }

  // TrackBy function para mejorar rendimiento y identificación única
  trackByMovieId(index: number, movie: Movie): string {
    return movie.id;
  }

  onViewDetail(movie: Movie): void {
    // Navegar con el tipo para diferenciar películas de series
    const type = this.currentTab === 'movies' ? 'movie' : 'series';
    this.router.navigate(['/ejercicio', type, movie.id]);
  }

  private showSnackBar(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, '✕', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: type === 'success' ? 'snackbar-success' : 'snackbar-error'
    });
  }
}
