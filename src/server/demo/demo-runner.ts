import { createDemoDatabase } from "./demo-database";
import { loadDemoEnvironment } from "./demo-environment";
import { createDemoRepository } from "./demo-repository";
import { createDemoService } from "./demo-service";

export async function runDemoOperation(mode: "seed" | "reset"): Promise<void> {
  const environment = loadDemoEnvironment(process.env);
  const database = createDemoDatabase(environment);

  try {
    await database.assertTarget();
    await database.migrate();
    const service = createDemoService({
      repository: createDemoRepository(),
      withTransaction: database.withTransaction,
    });
    await service[mode]();
  } finally {
    await database.close();
  }
}
