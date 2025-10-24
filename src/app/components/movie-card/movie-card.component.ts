import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Movie } from '../../models/movie.model';

@Component({
  selector: 'app-movie-card',
  templateUrl: './movie-card.component.html',
  styleUrls: ['./movie-card.component.scss']
})
export class MovieCardComponent {
  @Input() movie!: Movie;
  @Output() editMovie = new EventEmitter<Movie>();
  @Output() deleteMovie = new EventEmitter<Movie>();
  @Output() viewDetail = new EventEmitter<Movie>();

  // Imagen placeholder cuando falla la carga
  private readonly placeholderImage = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0iIzJhMmEyYSIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM2NjY2NjYiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj7imIXvuI8gSW1hZ2VuIG5vIGRpc3BvbmlibGU8L3RleHQ+PC9zdmc+';

  openIMDB(): void {
    if (this.movie.imdb_link) {
      window.open(this.movie.imdb_link, '_blank');
    }
  }

  onEdit(event: Event): void {
    event.stopPropagation();
    this.editMovie.emit(this.movie);
  }

  onDelete(event: Event): void {
    event.stopPropagation();
    this.deleteMovie.emit(this.movie);
  }

  onCardClick(): void {
    this.viewDetail.emit(this.movie);
  }

  onImageError(event: Event): void {
    const imgElement = event.target as HTMLImageElement;
    console.warn(`Imagen no disponible para: ${this.movie.title}`);
    console.warn(`URL intentada: ${this.movie.big_image || this.movie.image}`);
    imgElement.src = this.placeholderImage;
  }
}
