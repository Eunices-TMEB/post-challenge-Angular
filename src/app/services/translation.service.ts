import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  
  private genreTranslations: { [key: string]: string } = {
    'Action': 'Acción',
    'Adventure': 'Aventura',
    'Animation': 'Animación',
    'Biography': 'Biografía',
    'Comedy': 'Comedia',
    'Crime': 'Crimen',
    'Documentary': 'Documental',
    'Drama': 'Drama',
    'Family': 'Familiar',
    'Fantasy': 'Fantasía',
    'Film-Noir': 'Cine Negro',
    'History': 'Historia',
    'Horror': 'Terror',
    'Music': 'Música',
    'Musical': 'Musical',
    'Mystery': 'Misterio',
    'Romance': 'Romance',
    'Sci-Fi': 'Ciencia Ficción',
    'Sport': 'Deportes',
    'Thriller': 'Suspenso',
    'War': 'Guerra',
    'Western': 'Western'
  };

  private movieTitleTranslations: { [key: string]: string } = {
    'The Shawshank Redemption': 'Sueño de fuga',
    'The Godfather': 'El Padrino',
    'The Dark Knight': 'El Caballero de la Noche',
    'The Godfather Part II': 'El Padrino: Parte II',
    'The Lord of the Rings: The Return of the King': 'El Señor de los Anillos: El Retorno del Rey',
    'Schindler\'s List': 'La Lista de Schindler',
    'Pulp Fiction': 'Tiempos Violentos',
    'The Lord of the Rings: The Fellowship of the Ring': 'El Señor de los Anillos: La Comunidad del Anillo',
    'The Good, the Bad and the Ugly': 'El Bueno, el Malo y el Feo',
    'Forrest Gump': 'Forrest Gump',
    'The Lord of the Rings: The Two Towers': 'El Señor de los Anillos: Las Dos Torres',
    'Fight Club': 'El Club de la Pelea',
    'Inception': 'El Origen',
    'Star Wars: Episode V - The Empire Strikes Back': 'Star Wars: Episodio V - El Imperio Contraataca',
    'The Matrix': 'Matrix',
    'Goodfellas': 'Buenos Muchachos',
    'One Flew Over the Cuckoo\'s Nest': 'Alguien Voló Sobre el Nido del Cuco',
    'Interstellar': 'Interestelar',
    'Seven Samurai': 'Los Siete Samurái',
    'Se7en': 'Siete',
    'It\'s a Wonderful Life': 'Qué Bello es Vivir',
    'The Silence of the Lambs': 'El Silencio de los Inocentes',
    'Saving Private Ryan': 'Rescatando al Soldado Ryan',
    'City of God': 'Ciudad de Dios',
    'Life Is Beautiful': 'La Vida es Bella',
    'The Green Mile': 'La Milla Verde',
    'Star Wars: Episode IV - A New Hope': 'Star Wars: Episodio IV - Una Nueva Esperanza',
    'Terminator 2: Judgment Day': 'Terminator 2: El Juicio Final',
    'Back to the Future': 'Volver al Futuro',
    'Spirited Away': 'El Viaje de Chihiro',
    'The Pianist': 'El Pianista',
    'Psycho': 'Psicosis',
    'Léon: The Professional': 'León: El Profesional',
    'The Lion King': 'El Rey León',
    'Gladiator': 'Gladiador',
    'American History X': 'Historia Americana X',
    'The Departed': 'Los Infiltrados',
    'The Usual Suspects': 'Sospechosos Habituales',
    'The Prestige': 'El Truco Final',
    'Whiplash': 'Whiplash',
    'Casablanca': 'Casablanca',
    'Modern Times': 'Tiempos Modernos',
    'City Lights': 'Luces de la Ciudad',
    'Once Upon a Time in the West': 'Hasta que Llegó su Hora',
    'Rear Window': 'La Ventana Indiscreta',
    'Grave of the Fireflies': 'La Tumba de las Luciérnagas',
    'Alien': 'Alien: El Octavo Pasajero',
    'Apocalypse Now': 'Apocalipsis Ahora',
    'Django Unchained': 'Django Sin Cadenas',
    'WALL·E': 'WALL·E',
    'The Lives of Others': 'La Vida de los Otros',
    'Sunset Boulevard': 'El Crepúsculo de los Dioses',
    'Paths of Glory': 'Senderos de Gloria',
    'The Shining': 'El Resplandor',
    'The Great Dictator': 'El Gran Dictador',
    'Witness for the Prosecution': 'Testigo de Cargo',
    'Aliens': 'Aliens: El Regreso',
    'American Beauty': 'Belleza Americana',
    'Dr. Strangelove': 'Dr. Insólito',
    'Spider-Man: Into the Spider-Verse': 'Spider-Man: Un Nuevo Universo',
    'The Dark Knight Rises': 'El Caballero de la Noche Asciende',
    'Oldboy': 'Old Boy',
    'Inglourious Basterds': 'Bastardos sin Gloria',
    'Toy Story': 'Toy Story',
    'Amadeus': 'Amadeus',
    'Braveheart': 'Corazón Valiente',
    'Joker': 'Joker',
    'Avengers: Infinity War': 'Vengadores: Infinity War',
    'Good Will Hunting': 'En Busca del Destino',
    'Once Upon a Time in America': 'Érase una Vez en América',
    'Your Name': 'Your Name',
    'Toy Story 3': 'Toy Story 3',
    'Capernaum': 'Cafarnaúm',
    'High and Low': 'Entre el Cielo y el Infierno',
    'Singin\' in the Rain': 'Cantando bajo la Lluvia',
    'Come and See': 'Ven y Mira',
    'Requiem for a Dream': 'Réquiem por un Sueño',
    'Star Wars: Episode VI - Return of the Jedi': 'Star Wars: Episodio VI - El Regreso del Jedi',
    '2001: A Space Odyssey': '2001: Odisea del Espacio',
    'Eternal Sunshine of the Spotless Mind': 'Eterno Resplandor de una Mente sin Recuerdos',
    'The Hunt': 'La Caza',
    'Reservoir Dogs': 'Perros de Reserva',
    'Citizen Kane': 'Ciudadano Kane',
    'M': 'M, el Vampiro de Düsseldorf',
    'Lawrence of Arabia': 'Lawrence de Arabia',
    'North by Northwest': 'Con la Muerte en los Talones',
    'Vertigo': 'Vértigo',
    'Full Metal Jacket': 'La Chaqueta Metálica',
    'Bicycle Thieves': 'Ladrón de Bicicletas',
    'A Clockwork Orange': 'La Naranja Mecánica',
    'The Apartment': 'El Apartamento',
    'Double Indemnity': 'Perdición',
    'To Kill a Mockingbird': 'Matar un Ruiseñor',
    'Scarface': 'Caracortada',
    'The Kid': 'El Chico',
    'Taxi Driver': 'Taxi Driver',
    'Indiana Jones and the Last Crusade': 'Indiana Jones y la Última Cruzada'
  };

  constructor() { }

  translateGenre(genre: string): string {
    return this.genreTranslations[genre] || genre;
  }

  translateGenres(genres: string[]): string[] {
    return genres.map(genre => this.translateGenre(genre));
  }

  translateTitle(title: string): string {
    return this.movieTitleTranslations[title] || title;
  }

  getAvailableGenresInSpanish(): string[] {
    return Object.values(this.genreTranslations).sort();
  }

  getGenreInEnglish(spanishGenre: string): string {
    const entry = Object.entries(this.genreTranslations)
      .find(([_, spanish]) => spanish === spanishGenre);
    return entry ? entry[0] : spanishGenre;
  }
}
