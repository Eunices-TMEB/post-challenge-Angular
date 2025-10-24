import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Movie } from '../../models/movie.model';
import { TranslationService } from '../../services/translation.service';

@Component({
  selector: 'app-movie-form-dialog',
  templateUrl: './movie-form-dialog.component.html',
  styleUrls: ['./movie-form-dialog.component.scss']
})
export class MovieFormDialogComponent implements OnInit {
  movieForm!: FormGroup;
  isEditMode: boolean = false;
  availableGenres: string[] = [];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<MovieFormDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { movie: Movie | null },
    private translationService: TranslationService
  ) {
    this.isEditMode = !!data?.movie;
    this.availableGenres = this.translationService.getAvailableGenresInSpanish();
  }

  ngOnInit(): void {
    this.initForm();
    
    if (this.isEditMode && this.data.movie) {
      this.populateForm(this.data.movie);
    }
  }

  private initForm(): void {
    this.movieForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(200)]],
      description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]],
      year: ['', [Validators.required, Validators.min(1888), Validators.max(new Date().getFullYear() + 5)]],
      rating: ['', [Validators.required, Validators.min(0), Validators.max(10), Validators.pattern(/^\d+(\.\d{1})?$/)]],
      image: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/)]],
      big_image: ['', [Validators.pattern(/^https?:\/\/.+/)]],
      genre: [[], [Validators.required, Validators.minLength(1)]],
      director: [''],
      writers: [''],
      imdb_link: ['', [Validators.pattern(/^https?:\/\/.+/)]]
    });
  }

  private populateForm(movie: Movie): void {
    this.movieForm.patchValue({
      title: movie.title,
      description: movie.description,
      year: movie.year,
      rating: movie.rating,
      image: movie.image,
      big_image: movie.big_image,
      genre: movie.genre,
      director: movie.director ? movie.director.join(', ') : '',
      writers: movie.writers ? movie.writers.join(', ') : '',
      imdb_link: movie.imdb_link
    });
  }

  onSubmit(): void {
    if (this.movieForm.valid) {
      const formValue = this.movieForm.value;
      
      const movie: Movie = {
        ...(this.data.movie || {}),
        title: formValue.title,
        description: formValue.description,
        year: parseInt(formValue.year),
        rating: formValue.rating.toString(),
        image: formValue.image,
        big_image: formValue.big_image || formValue.image,
        thumbnail: formValue.image,
        genre: formValue.genre,
        director: formValue.director ? formValue.director.split(',').map((d: string) => d.trim()).filter((d: string) => d) : [],
        writers: formValue.writers ? formValue.writers.split(',').map((w: string) => w.trim()).filter((w: string) => w) : [],
        imdb_link: formValue.imdb_link || `https://www.imdb.com/`,
        rank: this.data.movie?.rank || 0,
        id: this.data.movie?.id || '',
        imdbid: this.data.movie?.imdbid || ''
      } as Movie;

      this.dialogRef.close(movie);
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.movieForm.controls).forEach(key => {
        this.movieForm.get(key)?.markAsTouched();
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  getErrorMessage(fieldName: string): string {
    const field = this.movieForm.get(fieldName);
    if (!field) return '';

    if (field.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} es requerido`;
    }
    if (field.hasError('minLength')) {
      return `${this.getFieldLabel(fieldName)} debe tener al menos ${field.getError('minLength').requiredLength} caracteres`;
    }
    if (field.hasError('maxLength')) {
      return `${this.getFieldLabel(fieldName)} no debe exceder ${field.getError('maxLength').requiredLength} caracteres`;
    }
    if (field.hasError('min')) {
      return `${this.getFieldLabel(fieldName)} debe ser al menos ${field.getError('min').min}`;
    }
    if (field.hasError('max')) {
      return `${this.getFieldLabel(fieldName)} no debe exceder ${field.getError('max').max}`;
    }
    if (field.hasError('pattern')) {
      if (fieldName === 'rating') {
        return 'La calificación debe ser un número con máximo 1 decimal (ej: 8.5)';
      }
      if (fieldName === 'image' || fieldName === 'big_image' || fieldName === 'imdb_link') {
        return 'Debe ser una URL válida que comience con http:// o https://';
      }
    }

    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      title: 'El título',
      description: 'La descripción',
      year: 'El año',
      rating: 'La calificación',
      image: 'La URL de imagen',
      big_image: 'La URL de imagen grande',
      genre: 'El género',
      director: 'El director',
      writers: 'Los escritores',
      imdb_link: 'El enlace IMDB'
    };
    return labels[fieldName] || fieldName;
  }
}
