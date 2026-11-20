

export const PLATOS = [
  {
    id: 1,
    nombre: 'Sopa de Lentejas con Espinacas',
    descripcion:
      'Sopa nutritiva y reconfortante, ideal para combatir la anemia. Rica en hierro no hemo y fibra.',
    detalle:
      'Sopa nutritiva y reconfortante, ideal para combatir la anemia. Rica en hierro no hemínico y vitamina C.',
    precio: 4.5,
    kcal: 280,
    porciones: 1,
    minutos: 20,
    insignia: 'Hierro',
    insigniaDetalle: 'Rico en hierro',
    etiquetas: [
      'Rico en hierro',
      'Sin gluten',
    ],
    etiquetasDetalle: [
      'Rico en hierro',
      'Sin gluten',
      'Alto en fibra',
    ],
    notaApto: 'Rico en hierro',
    imagen: '/platos/sopa-lentejas.jpg',
    emoji: '🍲',
    ingredientes: [
      {
        nombre: 'Lentejas',
        cantidad: '100g',
        destacado: 'Hierro',
      },
      {
        nombre: 'Espinacas',
        cantidad: '80g',
        destacado: 'Hierro',
      },
      {
        nombre: 'Zanahoria',
        cantidad: '1 unidad',
      },
      {
        nombre: 'Cebolla',
        cantidad: '½ unidad',
      },
      {
        nombre: 'Ajo',
        cantidad: '2 dientes',
      },
      {
        nombre: 'Caldo de verduras',
        cantidad: '250 ml',
        cantidadAproximada: true,
      },
      {
        nombre: 'Sal',
        cantidad: '1 g',
        cantidadAproximada: true,
      },
      {
        nombre: 'Pimienta',
        cantidad: '1 g',
        cantidadAproximada: true,
      },
    ],
  },

  {
    id: 2,
    nombre: 'Bowl de Quinua con Pollo',
    descripcion:
      'Bowl completo y balanceado con la proteína completa de la quinua andina y pollo a la plancha.',
    precio: 6.0,
    kcal: 420,
    porciones: 1,
    minutos: 25,
    etiquetas: [
      'Alto en proteína',
      'Sin lactosa',
    ],
    notaApto: 'Alto en proteína',
    imagen: '/platos/bowl-quinua.jpg',
    emoji: '🥗',
    ingredientes: [
      {
        nombre: 'Quinua',
        cantidad: '80g',
      },
      {
        nombre: 'Pechuga de pollo',
        cantidad: '100g',
      },
      {
        nombre: 'Espinaca',
        cantidad: '30g',
        destacado: 'Hierro',
      },
      {
        nombre: 'Palta',
        cantidad: '¼ unidad',
      },
      {
        nombre: 'Tomate',
        cantidad: '1 unidad',
      },
      {
        nombre: 'Limón',
        cantidad: '½ unidad',
      },
      {
        nombre: 'Sal',
        cantidad: '1 g',
        cantidadAproximada: true,
      },
      {
        nombre: 'Pimienta',
        cantidad: '1 g',
        cantidadAproximada: true,
      },
    ],
  },

  {
    id: 3,
    nombre: 'Ensalada de Espinaca y Betarraga',
    descripcion:
      'Ensalada fresca y llena de hierro. La betarraga potencia la absorción de nutrientes.',
    precio: 3.5,
    kcal: 180,
    porciones: 1,
    minutos: 15,
    insignia: 'Hierro',
    insigniaDetalle: 'Rico en hierro',
    etiquetas: [
      'Rico en hierro',
      'Vegano',
    ],
    notaApto: 'Rico en hierro',
    imagen: '/platos/ensalada-espinaca.jpg',
    emoji: '🥬',
    ingredientes: [
      {
        nombre: 'Espinaca fresca',
        cantidad: '100g',
        destacado: 'Hierro',
      },
      {
        nombre: 'Betarraga cocida',
        cantidad: '1 unidad',
      },
      {
        nombre: 'Limón',
        cantidad: '1 unidad',
      },
      {
        nombre: 'Aceite de oliva',
        cantidad: '1 cucharada',
      },
      {
        nombre: 'Sal',
        cantidad: '1 g',
        cantidadAproximada: true,
      },
    ],
  },

  {
    id: 4,
    nombre: 'Guiso de Frejoles con Arroz',
    descripcion:
      'Combinación clásica y nutritiva. Los frejoles aportan proteínas vegetales y fibra.',
    precio: 3.0,
    kcal: 350,
    porciones: 1,
    minutos: 40,
    etiquetas: [
      'Económico',
      'Alto en fibra',
    ],
    notaApto: 'Económico',
    imagen: '/platos/guiso-frejoles.jpg',
    emoji: '🫘',
    ingredientes: [
      {
        nombre: 'Frejoles',
        cantidad: '100g',
        destacado: 'Hierro',
      },
      {
        nombre: 'Arroz',
        cantidad: '½ taza',
        cantidadAproximada: true,
      },
      {
        nombre: 'Cebolla',
        cantidad: '½ unidad',
      },
      {
        nombre: 'Ajo',
        cantidad: '2 dientes',
      },
      {
        nombre: 'Tomate',
        cantidad: '1 unidad',
      },
      {
        nombre: 'Comino',
        cantidad: '1 g',
        cantidadAproximada: true,
      },
      {
        nombre: 'Sal',
        cantidad: '1 g',
        cantidadAproximada: true,
      },
    ],
  },

  {
    id: 5,
    nombre: 'Saltado de Verduras al Wok',
    descripcion:
      'Colorido y crujiente saltado de verduras frescas. Listo en 15 minutos.',
    precio: 5.0,
    kcal: 220,
    porciones: 1,
    minutos: 15,
    etiquetas: [
      'Vegano',
      'Sin gluten',
    ],
    notaApto: 'Vegano',
    imagen: '/platos/saltado-verduras.jpg',
    emoji: '🥦',
    ingredientes: [
      {
        nombre: 'Brócoli',
        cantidad: '80g',
      },
      {
        nombre: 'Coliflor',
        cantidad: '60g',
      },
      {
        nombre: 'Zanahoria',
        cantidad: '1 unidad',
      },
      {
        nombre: 'Pimiento',
        cantidad: '½ unidad',
      },
      {
        nombre: 'Ajo',
        cantidad: '1 diente',
      },
      {
        nombre: 'Aceite',
        cantidad: '1 cucharada',
      },
    ],
  },
]

/*
  Formatear precios en soles.

  Evita el error:
  Cannot read properties of null (reading 'toFixed')
*/

export const soles = (n) => {
  // No existe precio registrado.
  if (
    n === null ||
    n === undefined ||
    n === ''
  ) {
    return 'Sin precio disponible'
  }

  // Convertir números provenientes de SQL Server.
  const precio = Number(n)

  // Evitar mostrar valores no numéricos.
  if (!Number.isFinite(precio)) {
    return 'Sin precio disponible'
  }

  // Mostrar moneda peruana.
  return `S/. ${precio.toFixed(2)}`
}
