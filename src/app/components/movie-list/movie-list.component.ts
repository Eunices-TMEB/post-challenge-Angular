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
  selectedGenre: string = 'all';
  availableGenres: string[] = [];
  currentTab: 'movies' | 'series' = 'movies';
  private readonly TAB_STORAGE_KEY = 'current_tab';
  
  viewMode: 'grid' | 'table' = 'grid';
  
  pageSize: number = 12;
  pageIndex: number = 0;
  pageSizeOptions: number[] = [12, 24, 48, 100];
  totalItems: number = 0;
  
  displayedColumns: string[] = ['rank', 'title', 'year', 'rating', 'genre', 'director', 'actions'];
  
  Math = Math;

  constructor(
    private moviesService: MoviesService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) { }

  ngOnInit(): void {
    const savedTab = sessionStorage.getItem(this.TAB_STORAGE_KEY) as 'movies' | 'series' | null;
    if (savedTab) {
      this.currentTab = savedTab;
    }
    
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
        this.movies = result.movies;
        this.series = result.series;
        
        const activeData = this.currentTab === 'movies' ? this.movies : this.series;
        this.filteredMovies = activeData;
        this.totalItems = activeData.length;
        this.dataSource.data = activeData;
        
        this.updateAvailableGenres();
        this.updatePaginatedMovies();
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar los datos. Por favor, intenta de nuevo más tarde.';
        this.loading = false;
      }
    });
  }

  loadMovies(): void {
    this.loading = true;
    this.moviesService.getTop100Movies().subscribe({
      next: (data) => {
        this.movies = data;
        if (this.currentTab === 'movies') {
          this.filteredMovies = data;
          this.totalItems = data.length;
          this.dataSource.data = data;
          this.updatePaginatedMovies();
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar las películas. Por favor, intenta de nuevo más tarde.';
        this.loading = false;
      }
    });
  }

  loadSeries(): void {
    this.loading = true;
    this.moviesService.getTop100Series().subscribe({
      next: (data) => {
        this.series = data;
        if (this.currentTab === 'series') {
          this.filteredMovies = data;
          this.totalItems = data.length;
          this.dataSource.data = data;
          this.updatePaginatedMovies();
        }
        this.loading = false;
      },
      error: () => {
        this.error = 'Error al cargar las series. Por favor, intenta de nuevo más tarde.';
        this.loading = false;
      }
    });
  }

  onTabChange(tab: 'movies' | 'series'): void {
    this.currentTab = tab;
    sessionStorage.setItem(this.TAB_STORAGE_KEY, tab);
    
    this.searchTerm = '';
    this.selectedGenre = 'all';
    this.pageIndex = 0;
    
    const data = tab === 'movies' ? this.movies : this.series;
    this.filteredMovies = data;
    this.totalItems = data.length;
    this.dataSource.data = data;
    
    this.updateAvailableGenres();
    this.updatePaginatedMovies();
  }
  
  toggleView(mode: 'grid' | 'table'): void {
    this.viewMode = mode;
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
    let filtered = sourceData;
    
    if (this.selectedGenre !== 'all') {
      filtered = filtered.filter(movie =>
        movie.genre.some(g => g.toLowerCase() === this.selectedGenre.toLowerCase())
      );
    }
    
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(movie =>
        movie.title.toLowerCase().includes(term) ||
        movie.description.toLowerCase().includes(term) ||
        movie.genre.some(g => g.toLowerCase().includes(term))
      );
    }
    
    this.filteredMovies = filtered;
    this.totalItems = this.filteredMovies.length;
    this.dataSource.data = this.filteredMovies;
    this.pageIndex = 0;
    this.updatePaginatedMovies();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.selectedGenre = 'all';
    const sourceData = this.currentTab === 'movies' ? this.movies : this.series;
    this.filteredMovies = sourceData;
    this.totalItems = sourceData.length;
    this.dataSource.data = sourceData;
    this.pageIndex = 0;
    this.updatePaginatedMovies();
  }
  
  onGenreChange(): void {
    this.onSearch();
  }
  
  updateAvailableGenres(): void {
    const sourceData = this.currentTab === 'movies' ? this.movies : this.series;
    const genresSet = new Set<string>();
    
    sourceData.forEach(item => {
      item.genre.forEach(g => genresSet.add(g));
    });
    
    this.availableGenres = Array.from(genresSet).sort();
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
      error: () => {
        const tipo = this.currentTab === 'movies' ? 'película' : 'serie';
        this.showSnackBar(`Error al crear la ${tipo}. Por favor, intenta de nuevo.`, 'error');
      }
    });
  }

  updateMovie(movie: Movie): void {
    const tipo = this.currentTab === 'movies' ? 'Película' : 'Serie';
    const tipoLower = tipo.toLowerCase();
    
    this.moviesService.updateMovie(movie, this.currentTab).subscribe({
      next: () => {
        const sourceData = this.currentTab === 'movies' ? this.movies : this.series;
        const index = sourceData.findIndex(m => m.id === movie.id);
        if (index !== -1) {
          sourceData[index] = movie;
          this.filteredMovies = [...sourceData];
          this.dataSource.data = this.filteredMovies;
          this.updatePaginatedMovies();
          if (this.searchTerm) {
            this.onSearch();
          }
        }
        this.showSnackBar(`¡${tipo} actualizada exitosamente! ✏️`, 'success');
      },
      error: () => {
        this.showSnackBar(`Error al actualizar la ${tipoLower}. Por favor, intenta de nuevo.`, 'error');
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
        this.moviesService.deleteMovie(movie.id, this.currentTab).subscribe({
          next: (success) => {
            if (success) {
              if (this.currentTab === 'movies') {
                this.movies = this.movies.filter(m => m.id !== movie.id);
                this.filteredMovies = [...this.movies];
              } else {
                this.series = this.series.filter(m => m.id !== movie.id);
                this.filteredMovies = [...this.series];
              }
              this.dataSource.data = this.filteredMovies;
              this.updatePaginatedMovies();
              if (this.searchTerm) {
                this.onSearch();
              }
              this.showSnackBar(`¡${tipo} eliminada exitosamente! 🗑️`, 'success');
            } else {
              const tipoLower = tipo.toLowerCase();
              this.showSnackBar(`Error al eliminar la ${tipoLower}. Por favor, intenta de nuevo.`, 'error');
            }
          },
          error: () => {
            const tipoLower = tipo.toLowerCase();
            this.showSnackBar(`Error al eliminar la ${tipoLower}. Por favor, intenta de nuevo.`, 'error');
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
          error: () => {
            this.error = 'Error al restaurar los datos. Por favor, intenta de nuevo.';
            this.loading = false;
            this.showSnackBar('Error al restaurar los datos. Por favor, intenta de nuevo.', 'error');
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
          error: () => {
            this.error = 'Error al cargar los datos. Por favor, intenta de nuevo.';
            this.loading = false;
            this.showSnackBar('Error al cargar los datos. Por favor, intenta de nuevo.', 'error');
          }
        });
      }
    });
  }

  getGenresString(genres: string[]): string {
    return genres.join(', ');
  }

  trackByMovieId(index: number, movie: Movie): string {
    return movie.id;
  }

  onViewDetail(movie: Movie): void {
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
