// Solo inspecciona: no aplica synchronize ni modifica datos.
require('ts-node/register');
process.loadEnvFile();
const { DataSource } = require('typeorm');
const { Paciente } = require('../src/entities/paciente.entity');
const { Medico } = require('../src/entities/medico.entity');
const { Cita } = require('../src/entities/cita.entity');
const db = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [Paciente, Medico, Cita],
  synchronize: false,
});
(async () => {
  try {
    await db.initialize();
    const plan = await db.driver.createSchemaBuilder().log();
    console.log(
      JSON.stringify(
        plan.upQueries.map((q) => q.query),
        null,
        2,
      ),
    );
  } finally {
    if (db.isInitialized) await db.destroy();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
