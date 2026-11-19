
using System;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;

namespace PlatoMatchBackend.Models
{
    public static class CostosIngredientes
    {
        public static string Normalizar(string? valor)
        {
            string texto = (valor ?? "")
                .Normalize(NormalizationForm.FormD);

            var sb = new StringBuilder();

            foreach (char c in texto)
            {
                if (CharUnicodeInfo.GetUnicodeCategory(c)
                    != UnicodeCategory.NonSpacingMark)
                {
                    sb.Append(char.ToLowerInvariant(c));
                }
            }

            return Regex.Replace(
                sb.ToString(), @"\s+", " "
            ).Trim();
        }

        private static string Singular(string palabra)
        {
            if (palabra.Length > 5 &&
                palabra.EndsWith("es"))
                return palabra[..^2];

            if (palabra.Length > 3 &&
                palabra.EndsWith("s"))
                return palabra[..^1];

            return palabra;
        }

        public static bool ProductoCompatible(
            string a, string b)
        {
            var palabrasA = Regex.Matches(
                Normalizar(a), @"[a-z0-9]+")
                .Select(m => Singular(m.Value))
                .ToList();

            var palabrasB = Regex.Matches(
                Normalizar(b), @"[a-z0-9]+")
                .Select(m => Singular(m.Value))
                .ToList();

            if (palabrasA.Count == 0 ||
                palabrasB.Count == 0)
                return false;

            var corta = palabrasA.Count <= palabrasB.Count
                ? palabrasA : palabrasB;

            var larga = palabrasA.Count > palabrasB.Count
                ? palabrasA : palabrasB;

            return corta.All(larga.Contains);
        }

        private static (string tipo, decimal factor)
            ConvertirUnidad(string? unidad)
        {
            return Normalizar(unidad) switch
            {
                "kg" or "kilo" or "kilogramo"
                    or "kilogramos" => ("masa", 1000m),

                "g" or "gr" or "gramo"
                    or "gramos" => ("masa", 1m),

                "l" or "litro" or "litros"
                    => ("volumen", 1000m),

                "ml" or "mililitro" or "mililitros"
                    => ("volumen", 1m),

                "unidad" or "unidades" or "und"
                    => ("unidad", 1m),

                "diente" or "dientes"
                    => ("diente", 1m),

                "taza" or "tazas" => ("taza", 1m),

                "cucharada" or "cucharadas"
                    => ("cucharada", 1m),

                "cucharadita" or "cucharaditas"
                    => ("cucharadita", 1m),

                "atado" or "atados" => ("atado", 1m),

                _ => ("desconocida", 0m)
            };
        }


public static decimal? ConvertirCantidad(
    decimal cantidad,
    string unidadOrigen,
    string unidadDestino)
{
    var origen = ConvertirUnidad(unidadOrigen);
    var destino = ConvertirUnidad(unidadDestino);

    if (origen.factor == 0 ||
        destino.factor == 0 ||
        origen.tipo != destino.tipo)
    {
        return null;
    }

    return cantidad * origen.factor / destino.factor;
}


        public static decimal? Calcular(
            decimal cantidadNecesaria,
            string unidadNecesaria,
            PrecioMercado precio)
        {
            var destino = ConvertirUnidad(unidadNecesaria);
            var origen = ConvertirUnidad(precio.UnidadPrecio);

            if (destino.factor == 0 ||
                origen.factor == 0 ||
                destino.tipo != origen.tipo ||
                precio.CantidadPrecio <= 0 ||
                precio.Precio <= 0 ||
                cantidadNecesaria < 0)
            {
                return null;
            }

            decimal cantidadBase =
                cantidadNecesaria * destino.factor;

            decimal presentacionBase =
                precio.CantidadPrecio * origen.factor;

            return Math.Round(
                precio.Precio * cantidadBase / presentacionBase,
                2,
                MidpointRounding.AwayFromZero
            );
        }
    }
}
