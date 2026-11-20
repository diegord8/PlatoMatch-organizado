CREATE DATABASE PlatoMatchDB;
GO

USE [PlatoMatchDB];
GO

-- 1. Tablas Core y Usuarios
CREATE TABLE [dbo].[Usuarios] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [Nombre] NVARCHAR(100) NOT NULL,
    [Correo] NVARCHAR(100) NOT NULL UNIQUE,
    [Contrasena] NVARCHAR(255) NOT NULL,
    [Presupuesto] DECIMAL(18,2) NOT NULL DEFAULT 0,
    [CantidadPersonas] INT NOT NULL DEFAULT 1,
    [RestriccionesSalud] NVARCHAR(500) NULL
);

CREATE TABLE [dbo].[Mercados] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [Nombre] NVARCHAR(100) NOT NULL,
    [Distrito] NVARCHAR(100) NULL
);

CREATE TABLE [dbo].[Recetas] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [Nombre] NVARCHAR(150) NOT NULL,
    [Descripcion] NVARCHAR(500) NULL,
    [Calorias] INT NOT NULL,
    [TiempoPrep] INT NOT NULL,
    [CostoEstimado] DECIMAL(18,2) NOT NULL,
    [AptoAnemia] BIT NOT NULL DEFAULT 0,
    [AptoSinGluten] BIT NOT NULL DEFAULT 0,
    [ImagenUrl] NVARCHAR(255) NULL
);

CREATE TABLE [dbo].[Ingredientes] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [Nombre] NVARCHAR(100) NOT NULL,
    [Categoria] NVARCHAR(50) NULL
);

-- 2. Tablas Relacionales (El motor de la app)
CREATE TABLE [dbo].[RecetaIngredientes] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [RecetaId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Recetas]([Id]),
    [NombreIngrediente] NVARCHAR(100) NOT NULL,
    [CantidadBase] DECIMAL(18,2) NOT NULL,
    [Unidad] NVARCHAR(20) NOT NULL
);

CREATE TABLE [dbo].[PreciosMercado] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [MercadoId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Mercados]([Id]),
    [ProductoNombre] NVARCHAR(100) NOT NULL,
    [Precio] DECIMAL(18,4) NOT NULL,
    [FechaActualizacion] DATETIME NOT NULL DEFAULT GETDATE()
);

CREATE TABLE [dbo].[InventarioUsuarios] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [UsuarioId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Usuarios]([Id]),
    [NombreIngrediente] NVARCHAR(100) NOT NULL
);

CREATE TABLE [dbo].[PlatosGuardados] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [UsuarioId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Usuarios]([Id]),
    [RecetaId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Recetas]([Id])
);

-- 3. Tablas Transaccionales (Historial, Compras y Feedback)
CREATE TABLE [dbo].[ListasCompras] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [UsuarioId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Usuarios]([Id]),
    [RecetaId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Recetas]([Id]),
    [FechaCreacion] DATETIME NOT NULL DEFAULT GETDATE()
);

CREATE TABLE [dbo].[ItemsListaCompras] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [ListaCompraId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[ListasCompras]([Id]),
    [NombreIngrediente] NVARCHAR(100) NOT NULL,
    [Comprado] BIT NOT NULL DEFAULT 0
);

CREATE TABLE [dbo].[HistorialPreparaciones] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [UsuarioId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Usuarios]([Id]),
    [RecetaNombre] NVARCHAR(150) NOT NULL,
    [CostoEjecutado] DECIMAL(18,2) NOT NULL,
    [MercadoId] INT NULL FOREIGN KEY REFERENCES [dbo].[Mercados]([Id]),
    [Fecha] DATETIME NOT NULL DEFAULT GETDATE()
);

CREATE TABLE [dbo].[Feedbacks] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [UsuarioId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Usuarios]([Id]),
    [RecetaId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Recetas]([Id]),
    [Estrellas] INT NOT NULL,
    [Comentario] NVARCHAR(500) NULL,
    [Fecha] DATETIME NOT NULL DEFAULT GETDATE()
);

CREATE TABLE [dbo].[RecordatoriosUsuario] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [UsuarioId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Usuarios]([Id]),
    [HoraAlerta] NVARCHAR(10) NOT NULL,
    [Frecuencia] NVARCHAR(50) NOT NULL
);
GO