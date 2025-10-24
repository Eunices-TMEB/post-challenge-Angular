import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { MoviesService } from '../../services/movies.service';
import { Movie } from '../../models/movie.model';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MovieFormDialogComponent } from '../movie-form-dialog/movie-form-dialog.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-movie-detail',
  templateUrl: './movie-detail.component.html',
  styleUrls: ['./movie-detail.component.scss']
})
export class MovieDetailComponent implements OnInit {
  movie: Movie | null = null;
  loading: boolean = true;
  error: string = '';
  contentType: 'movie' | 'series' = 'movie';
  
  // Imagen placeholder cuando falla la carga
  private readonly placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iIzJhMmEyYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM2NjY2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7imIXvuI8gSW1hZ2VuIG5vIGRpc3BvbmlibGU8L3RleHQ+PC9zdmc+';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private moviesService: MoviesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) { }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      const type = params.get('type') as 'movie' | 'series' | null;
      
      // Guardar el tipo de contenido para uso en el template
      this.contentType = type || 'movie';
      
      if (id) {
        this.loadMovie(id, this.contentType);
      } else {
        this.error = 'ID no proporcionado';
        this.loading = false;
      }
    });
  }

  loadMovie(id: string, type: 'movie' | 'series'): void {
    this.loading = true;
    this.moviesService.getMovieById(id, type).subscribe({
      next: (movie) => {
        if (movie) {
          this.movie = movie;
          this.loading = false;
        } else {
          const contentType = type === 'movie' ? 'Película' : 'Serie';
          this.error = `${contentType} no encontrada`;
          this.loading = false;
        }
      },
      error: (error) => {
        const contentType = type === 'movie' ? 'película' : 'serie';
        this.error = `Error al cargar la ${contentType}. Por favor, intenta de nuevo más tarde.`;
        this.loading = false;
        console.error('Error loading content:', error);
      }
    });
  }

  goBack(): void {
    this.location.back();
  }

  openEditDialog(): void {
    if (!this.movie) return;

    const dialogRef = this.dialog.open(MovieFormDialogComponent, {
      width: '600px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: { movie: { ...this.movie } },
      disableClose: false,
      panelClass: 'movie-dialog'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.movie) {
        this.updateMovie(result);
      }
    });
  }

  updateMovie(movie: Movie): void {
    const tipo = this.contentType === 'movie' ? 'Película' : 'Serie';
    const tipoLower = tipo.toLowerCase();
    const dataType = this.contentType === 'movie' ? 'movies' : 'series';
    
    // Pasar el tipo al servicio para actualizar el localStorage correcto
    this.moviesService.updateMovie(movie, dataType).subscribe({
      next: () => {
        this.movie = movie;
        this.showSnackBar(`¡${tipo} actualizada exitosamente! ✏️`, 'success');
      },
      error: (error) => {
        this.showSnackBar(`Error al actualizar la ${tipoLower}. Por favor, intenta de nuevo.`, 'error');
        console.error('Error updating:', error);
      }
    });
  }

  deleteMovie(): void {
    if (!this.movie) return;

    const tipo = this.contentType === 'movie' ? 'Película' : 'Serie';
    const tipoLower = tipo.toLowerCase();
    const dataType = this.contentType === 'movie' ? 'movies' : 'series';

    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '500px',
      maxWidth: '95vw',
      data: {
        title: `Eliminar ${tipo}`,
        message: `¿Estás seguro de que deseas eliminar "${this.movie.title}"? Esta acción no se puede deshacer.`,
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        type: 'danger'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && this.movie) {
        // Pasar el tipo al servicio para actualizar el localStorage correcto
        this.moviesService.deleteMovie(this.movie.id, dataType).subscribe({
          next: (success) => {
            if (success) {
              this.showSnackBar(`¡${tipo} eliminada exitosamente! 🗑️`, 'success');
              this.router.navigate(['/']);
            } else {
              this.showSnackBar(`Error al eliminar la ${tipoLower}. Por favor, intenta de nuevo.`, 'error');
            }
          },
          error: (error) => {
            this.showSnackBar(`Error al eliminar la ${tipoLower}. Por favor, intenta de nuevo.`, 'error');
            console.error('Error deleting:', error);
          }
        });
      }
    });
  }

  openIMDB(): void {
    if (this.movie?.imdb_link) {
      window.open(this.movie.imdb_link, '_blank');
    }
  }

  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    if (this.movie) {
      console.warn(`Imagen no disponible para: ${this.movie.title}`);
      console.warn(`URL intentada: ${this.movie.big_image || this.movie.image}`);
    }
    imgElement.src = this.placeholderImage;
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

