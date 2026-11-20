USE [PlatoMatchDB];
GO

-- 1. Insertar Mercados Base
INSERT INTO [dbo].[Mercados] ([Nombre], [Distrito]) VALUES 
('Mercado Central', 'Cercado de Lima'),
('Mercado de Surquillo', 'Surquillo'),
('Mercado Santa Anita', 'Santa Anita'),
('Mercado Productores', 'Santa Anita'),
('Mercado San José', 'Jesús María');
GO

-- 2. Insertar Usuarios de Prueba (Contraseñas hasheadas en C# por defecto)
INSERT INTO [dbo].[Usuarios] ([Nombre], [Correo], [Contrasena], [Presupuesto], [CantidadPersonas]) VALUES
('Admin', 'admin@platomatch.pe', 'hash_pendiente', 0, 1),
('Danna', 'danna@ejemplo.com', 'hash_pendiente', 50.00, 2),
('Diego', 'diego@ejemplo.com', 'hash_pendiente', 40.00, 1);
GO

-- 3. Insertar Recetas Limpias y Normalizadas
INSERT INTO [dbo].[Recetas] (Nombre, Descripcion, Calorias, TiempoPrep, CostoEstimado, AptoAnemia, AptoSinGluten) VALUES 
('Lentejitas con Arroz', 'Guiso tradicional de lentejas suaves con arroz y aderezo criollo. Fuente natural de hierro no hemo y fibra.', 520, 35, 6.50, 1, 1),
('Arroz con Pollo Casero', 'Arroz verde aromático cocido en culantro, cerveza negra y caldo de pollo.', 680, 45, 11.50, 0, 1),
('Bistec de Hígado Encebollado', 'Filete tierno de hígado a la plancha con cebolla y tomate al vinagre, servido con arroz.', 540, 20, 8.50, 1, 1),
('Ceviche de Pescado', 'Pescado fresco marinado en limón, ají limo y culantro, acompañados de cebolla y choclo.', 340, 20, 13.00, 0, 1);
GO

-- 4. Inserción de Ingredientes en Relación a las Recetas (Cantidades ajustadas)
DECLARE @Lentejas INT = (SELECT TOP 1 Id FROM [dbo].[Recetas] WHERE Nombre = 'Lentejitas con Arroz');
DECLARE @Higado INT = (SELECT TOP 1 Id FROM [dbo].[Recetas] WHERE Nombre = 'Bistec de Hígado Encebollado');

INSERT INTO [dbo].[RecetaIngredientes] (RecetaId, NombreIngrediente, CantidadBase, Unidad) VALUES 
(@Lentejas, 'Lentejas', 0.12, 'kg'),
(@Lentejas, 'Arroz', 0.10, 'kg'),
(@Lentejas, 'Cebolla roja', 0.50, 'unidad'),
(@Lentejas, 'Tomate', 0.50, 'unidad'),
(@Higado, 'Hígado de res', 0.18, 'kg'),
(@Higado, 'Arroz', 0.12, 'kg'),
(@Higado, 'Cebolla roja', 1.00, 'unidad'),
(@Higado, 'Tomate', 0.50, 'unidad');
GO

-- 5. Calibración de Precios por Gramo/Ml (Corrige el error de S/ 35 por perejil)
INSERT INTO [dbo].[PreciosMercado] (MercadoId, ProductoNombre, Precio)
SELECT Id, 'Sillao (salsa de soya)', (3.50 / 500.0) FROM [dbo].[Mercados]
UNION ALL
SELECT Id, 'Aceite vegetal', (7.50 / 1000.0) FROM [dbo].[Mercados]
UNION ALL
SELECT Id, 'Cebolla china', (1.00 / 40.0) FROM [dbo].[Mercados]
UNION ALL
SELECT Id, 'Perejil fresco', (1.00 / 40.0) FROM [dbo].[Mercados]
UNION ALL
SELECT Id, 'Tomate', 3.50 FROM [dbo].[Mercados]; -- 3.50 por KG
GO