FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["MMEntrenamiento.sln", "./"]
COPY ["MMEntrenamiento.Api/MMEntrenamiento.Api.csproj", "MMEntrenamiento.Api/"]
COPY ["MMEntrenamiento.Application/MMEntrenamiento.Application.csproj", "MMEntrenamiento.Application/"]
COPY ["MMEntrenamiento.Domain/MMEntrenamiento.Domain.csproj", "MMEntrenamiento.Domain/"]
COPY ["MMEntrenamiento.Infrastructure/MMEntrenamiento.Infrastructure.csproj", "MMEntrenamiento.Infrastructure/"]
COPY ["MMEntrenamiento.Tests/MMEntrenamiento.Tests.csproj", "MMEntrenamiento.Tests/"]

RUN dotnet restore "MMEntrenamiento.Api/MMEntrenamiento.Api.csproj"

COPY . .
WORKDIR "/src/MMEntrenamiento.Api"
RUN dotnet build "MMEntrenamiento.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "MMEntrenamiento.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "MMEntrenamiento.Api.dll"]