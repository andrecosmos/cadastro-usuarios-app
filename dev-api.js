import process from 'node:process';

process.loadEnvFile('.env.local');

const { default: app } = await import('./api/index.js');

const port = Number(process.env.API_PORT || 5005);

app.listen(port, () => {
  console.log(`API local ouvindo na porta ${port}.`);
});