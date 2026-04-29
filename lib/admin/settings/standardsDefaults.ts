import { CATEGORY_TREE } from "@/lib/constants/workorderCategories";
import { WORKSPACE_COMPANY_ID } from "@/lib/constants/company";
import type { AdminItemCategoryDefinition, AdminUnitDefinition } from "@/lib/admin/settings/standardsTypes";

export function createDefaultUnitDefinitions(companyId = WORKSPACE_COMPANY_ID): AdminUnitDefinition[] {
  return [
    { id: "mock-unit-piece", company_id: companyId, code: "piece", name: "개", category: "count", is_active: true, sort_order: 10 },
    { id: "mock-unit-sheet", company_id: companyId, code: "sheet", name: "장", category: "count", is_active: true, sort_order: 20 },
    { id: "mock-unit-set", company_id: companyId, code: "set", name: "세트", category: "count", is_active: true, sort_order: 30 },
    { id: "mock-unit-yard", company_id: companyId, code: "yard", name: "야드", category: "length", is_active: true, sort_order: 40 },
    { id: "mock-unit-meter", company_id: companyId, code: "meter", name: "미터", category: "length", is_active: true, sort_order: 50 },
    { id: "mock-unit-roll", company_id: companyId, code: "roll", name: "롤", category: "bundle", is_active: true, sort_order: 60 },
    { id: "mock-unit-pack", company_id: companyId, code: "pack", name: "팩", category: "bundle", is_active: true, sort_order: 70 },
    { id: "mock-unit-box", company_id: companyId, code: "box", name: "박스", category: "bundle", is_active: true, sort_order: 80 },
    { id: "mock-unit-process", company_id: companyId, code: "process", name: "공정", category: "service", is_active: true, sort_order: 90 },
    { id: "mock-unit-case", company_id: companyId, code: "case", name: "건", category: "service", is_active: true, sort_order: 100 },
  ];
}

export function createDefaultItemCategoryDefinitions(companyId = WORKSPACE_COMPANY_ID): AdminItemCategoryDefinition[] {
  const rows: AdminItemCategoryDefinition[] = [];
  let level1Order = 10;

  Object.entries(CATEGORY_TREE).forEach(([category1, category2Map]) => {
    const level1Id = `category:${category1}`;
    rows.push({ id: level1Id, company_id: companyId, level: 1, parent_id: null, name: category1, is_active: true, sort_order: level1Order });

    let level2Order = 10;
    Object.entries(category2Map).forEach(([category2, category3Items]) => {
      const level2Id = `category:${category1}:${category2}`;
      const category3List = category3Items as readonly string[];
      rows.push({ id: level2Id, company_id: companyId, level: 2, parent_id: level1Id, name: category2, is_active: true, sort_order: level2Order });

      category3List.forEach((category3, index) => {
        rows.push({
          id: `category:${category1}:${category2}:${category3}`,
          company_id: companyId,
          level: 3,
          parent_id: level2Id,
          name: category3,
          is_active: true,
          sort_order: (index + 1) * 10,
        });
      });
      level2Order += 10;
    });
    level1Order += 10;
  });

  return rows;
}
