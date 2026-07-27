import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("fluxo principal de cadastro, busca e conflito", async ({ page }, testInfo) => {
  const numero = testInfo.project.name === "mobile" ? "08" : "07";
  const outroNumero = testInfo.project.name === "mobile" ? "18" : "17";
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Lotes do leilão" })).toBeVisible();
  await expect(page.getByText("Seu catálogo começa aqui")).toBeVisible();

  await page.getByLabel("Preço inicial").fill("10000000000");
  await expect(page.getByLabel("Preço inicial")).toHaveValue("99.999.999,99");

  await page.getByLabel("Número do lote").fill(numero);
  await page.getByLabel("Preço inicial").fill("185000");
  await expect(page.getByLabel("Preço inicial")).toHaveValue("1.850,00");
  await page.getByRole("button", { name: "Adicionar lote" }).click();

  await expect(page.getByText(`O lote ${numero} já está disponível no catálogo.`)).toBeVisible();
  await expect(page.getByText(`Lote ${numero}`, { exact: true })).toBeVisible();
  const lotRow = page.getByRole("row").filter({ hasText: `Lote ${numero}` });
  await expect(lotRow.getByText("R$ 1.850,00", { exact: true })).toBeVisible();

  await page.getByLabel("Número do lote").fill(outroNumero);
  await page.getByLabel("Preço inicial").fill("2000");
  await page.getByRole("button", { name: "Adicionar lote" }).click();
  await expect(page.getByText(`O lote ${outroNumero} já está disponível no catálogo.`)).toBeVisible();

  if (testInfo.project.name === "desktop") {
    await page.screenshot({ path: "output/playwright/fluxo-lotes.png", fullPage: true });
  }

  await page.getByLabel("Buscar lote por número").fill(numero);
  await page.getByRole("button", { name: "Buscar" }).click();
  await expect(page).toHaveURL(new RegExp(`busca=${numero}`));
  await expect(page.getByText(`Lote ${numero}`, { exact: true })).toBeVisible();
  await expect(page.locator("tbody tr")).toHaveCount(1);

  await page.getByLabel("Número do lote").fill(numero);
  await page.getByLabel("Preço inicial").fill("2000");
  await page.getByRole("button", { name: "Adicionar lote" }).click();
  await expect(page.getByText("Já existe um lote com este número.")).toBeVisible();
});

test("não possui violações sérias de acessibilidade na tela inicial", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Lotes do leilão" })).toBeVisible();

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();

  expect(results.violations.filter(({ impact }) => impact === "serious" || impact === "critical")).toEqual([]);
});
