import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MoviesService } from '../../services/movies.service';
import { Movie } from '../../models/movie.model';
import { MovieFormDialogComponent } from '../movie-form-dialog/movie-form-dialog.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-movie-list',
  templateUrl: './movie-list.component.html',
  styleUrls: ['./movie-list.component.scss']
})
export class MovieListComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  movies: Movie[] = [];
  filteredMovies: Movie[] = [];
  paginatedMovies: Movie[] = [];
  dataSource: MatTableDataSource<Movie> = new MatTableDataSource<Movie>([]);
  
  loading: boolean = true;
  error: string = '';
  searchTerm: string = '';
  
  // Vista: 'grid' o 'table'
  viewMode: 'grid' | 'table' = 'grid';
  
  // Paginación
  pageSize: number = 12;
  pageIndex: number = 0;
  pageSizeOptions: number[] = [12, 24, 48, 100];
  totalItems: number = 0;
  
  // Columnas de la tabla
  displayedColumns: string[] = ['rank', 'title', 'year', 'rating', 'genre', 'director', 'actions'];

  constructor(
    private moviesService: MoviesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadMovies();
  }

  ngAfterViewInit(): void {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  loadMovies(): void {
    this.loading = true;
    this.moviesService.getTop100Movies().subscribe({
      next: (data) => {
        console.log('Películas cargadas:', data);
        console.log('Primera película:', data[0]);
        this.movies = data;
        this.filteredMovies = data;
        this.totalItems = data.length;
        this.dataSource.data = data;
        this.updatePaginatedMovies();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar las películas. Por favor, intenta de nuevo más tarde.';
        this.loading = false;
        console.error('Error loading movies:', error);
      }
    });
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
    
    // Scroll hacia arriba al cambiar de página
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  
  updatePaginatedMovies(): void {
    const startIndex = this.pageIndex * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedMovies = this.filteredMovies.slice(startIndex, endIndex);
    this.totalItems = this.filteredMovies.length;
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredMovies = this.movies;
      this.dataSource.data = this.movies;
      this.pageIndex = 0;
      this.updatePaginatedMovies();
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredMovies = this.movies.filter(movie =>
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
    this.filteredMovies = this.movies;
    this.dataSource.data = this.movies;
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
        // Agregar la película al array local (NO recargar desde servicio)
        this.movies.push(newMovie);
        this.filteredMovies = [...this.movies];
        this.dataSource.data = this.filteredMovies;
        this.updatePaginatedMovies();
        this.showSnackBar('¡Película creada exitosamente! 🎬', 'success');
      },
      error: (error) => {
        this.showSnackBar('Error al crear la película. Por favor, intenta de nuevo.', 'error');
        console.error('Error creating movie:', error);
      }
    });
  }

  updateMovie(movie: Movie): void {
    this.moviesService.updateMovie(movie).subscribe({
      next: () => {
        // Actualizar la película en el array local (NO recargar desde servicio)
        const index = this.movies.findIndex(m => m.id === movie.id);
        if (index !== -1) {
          this.movies[index] = movie;
          this.filteredMovies = [...this.movies];
          this.dataSource.data = this.filteredMovies;
          this.updatePaginatedMovies();
          // Re-aplicar búsqueda si hay filtro activo
          if (this.searchTerm) {
            this.onSearch();
          }
        }
        this.showSnackBar('¡Película actualizada exitosamente! ✏️', 'success');
      },
      error: (error) => {
        this.showSnackBar('Error al actualizar la película. Por favor, intenta de nuevo.', 'error');
        console.error('Error updating movie:', error);
      }
    });
  }

  onDeleteMovie(movie: Movie): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      data: {
        title: 'Eliminar Película',
        message: `¿Estás seguro de que deseas eliminar "${movie.title}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.moviesService.deleteMovie(movie.id).subscribe({
          next: (success) => {
            if (success) {
              // Eliminar la película del array local (NO recargar desde servicio)
              this.movies = this.movies.filter(m => m.id !== movie.id);
              this.filteredMovies = [...this.movies];
              this.dataSource.data = this.filteredMovies;
              this.updatePaginatedMovies();
              // Re-aplicar búsqueda si hay filtro activo
              if (this.searchTerm) {
                this.onSearch();
              }
              this.showSnackBar('¡Película eliminada exitosamente! 🗑️', 'success');
            } else {
              this.showSnackBar('Error al eliminar la película. Por favor, intenta de nuevo.', 'error');
            }
          },
          error: (error) => {
            this.showSnackBar('Error al eliminar la película. Por favor, intenta de nuevo.', 'error');
            console.error('Error deleting movie:', error);
          }
        });
      }
    });
  }

  resetToOriginal(): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      data: {
        title: 'Restaurar Datos Originales',
        message: '¿Estás seguro de que deseas restaurar todos los datos a su estado original? Todos los cambios se perderán.',
        confirmText: 'Restaurar',
        cancelText: 'Cancelar',
        type: 'warning'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loading = true;
        this.moviesService.resetToOriginal().subscribe({
          next: (data) => {
            this.movies = data;
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

  private showSnackBar(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, '✕', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: type === 'success' ? 'snackbar-success' : 'snackbar-error'
    });
  }
}
