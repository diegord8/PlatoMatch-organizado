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

CREATE TABLE [dbo].[PlatosGuardados] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [UsuarioId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Usuarios]([Id]),
    [RecetaId] INT NOT NULL FOREIGN KEY REFERENCES [dbo].[Recetas]([Id])
);


CREATE TABLE [dbo].[Mercados] (
    [Id] INT IDENTITY(1,1) PRIMARY KEY,
    [Nombre] NVARCHAR(100) NOT NULL,
    [Distrito] NVARCHAR(100) NULL
);


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