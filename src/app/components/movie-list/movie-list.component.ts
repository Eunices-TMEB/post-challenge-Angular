import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MoviesService } from '../../services/movies.service';
import { Movie } from '../../models/movie.model';
import { MovieFormDialogComponent } from '../movie-form-dialog/movie-form-dialog.component';

@Component({
  selector: 'app-movie-list',
  templateUrl: './movie-list.component.html',
  styleUrls: ['./movie-list.component.scss']
})
export class MovieListComponent implements OnInit {
  movies: Movie[] = [];
  filteredMovies: Movie[] = [];
  loading: boolean = true;
  error: string = '';
  searchTerm: string = '';

  constructor(
    private moviesService: MoviesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.loadMovies();
  }

  loadMovies(): void {
    this.loading = true;
    this.moviesService.getTop100Movies().subscribe({
      next: (data) => {
        console.log('Películas cargadas:', data);
        console.log('Primera película:', data[0]);
        this.movies = data;
        this.filteredMovies = data;
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar las películas. Por favor, intenta de nuevo más tarde.';
        this.loading = false;
        console.error('Error loading movies:', error);
      }
    });
  }

  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredMovies = this.movies;
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredMovies = this.movies.filter(movie =>
      movie.title.toLowerCase().includes(term) ||
      movie.description.toLowerCase().includes(term) ||
      movie.genre.some(g => g.toLowerCase().includes(term))
    );
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredMovies = this.movies;
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(MovieFormDialogComponent, {
      width: '600px',
      maxWidth: '90vw',
      data: { movie: null },
      disableClose: false
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
      maxWidth: '90vw',
      data: { movie: { ...movie } },
      disableClose: false
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
        this.loadMovies();
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
        this.loadMovies();
        this.showSnackBar('¡Película actualizada exitosamente! ✏️', 'success');
      },
      error: (error) => {
        this.showSnackBar('Error al actualizar la película. Por favor, intenta de nuevo.', 'error');
        console.error('Error updating movie:', error);
      }
    });
  }

  onDeleteMovie(movie: Movie): void {
    if (confirm(`¿Estás seguro de que deseas eliminar "${movie.title}"?`)) {
      this.moviesService.deleteMovie(movie.id).subscribe({
        next: (success) => {
          if (success) {
            this.loadMovies();
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
  }

  resetToOriginal(): void {
    if (confirm('¿Estás seguro de que deseas restaurar todos los datos a su estado original? Todos los cambios se perderán.')) {
      this.loading = true;
      this.moviesService.resetToOriginal().subscribe({
        next: (data) => {
          this.movies = data;
          this.filteredMovies = data;
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
  }

  clearAndReload(): void {
    if (confirm('¿Estás seguro de que deseas limpiar el caché y recargar los datos desde la API?')) {
      this.loading = true;
      localStorage.clear();
      this.showSnackBar('Caché limpiado. Recargando datos...', 'success');
      
      // Reload from API
      this.moviesService.getTop100Movies().subscribe({
        next: (data) => {
          this.movies = data;
          this.filteredMovies = data;
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
  }

  private showSnackBar(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: type === 'success' ? 'snackbar-success' : 'snackbar-error'
    });
  }
}
