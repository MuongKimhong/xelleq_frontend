## CONTRIBUTING TO THIS PROJECT

Thank you for considering contributing to Xelleq! Whether it's fixing a bug or adding a new feature your contribution is valuable.

### Clone the repository
```
git clone https://github.com/MuongKimhong/xelleq_frontend.git
cd xelleq_frontend
```
### Create a `.env` file in root directory, then write
```
VITE_API_URL=http://localhost:8000
VITE_AGORA_APP_ID:random
```
### Start Vue3 development server
```
npm install
npm run dev
```
Access app at [http://localhost:5173](http://localhost:5173)

### Start Backend development server
This project need a backend to work. You might need to install Docker to run local backend server.

In a new terminal tab, within same root directory
```
docker compose -f docker-compose.contribute.yml down -v
docker compose -f docker-compose.contribute.yml up --build
```
or if you're using legacy `docker-compose`
```
docker-compose -f docker-compose.contribute.yml down -v
docker-compose -f docker-compose.contribute.yml up --build
```
For more information about installing Docker engine and docker compose, see
- [How to install Docker engine](https://docs.docker.com/engine/install/)
- [How to install Docker compose](https://docs.docker.com/compose/install/)

> [!WARNING]
> - Send mail feature will not work in development server
> - Voice call feature will not work in development server
