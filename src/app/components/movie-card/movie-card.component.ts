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
}
