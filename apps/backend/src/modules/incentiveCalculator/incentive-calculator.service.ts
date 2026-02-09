import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class IncentiveCalculatorService {
  constructor(private prisma: PrismaService) {}

  async getMsmeYearByPolicy(policyId: number) {
    const records = await this.prisma.kyiIcCalculator.findMany({
      where: {
        policy_id: policyId,
        isActive: true,
      },
      select: {
        msmeYear: true, // This fetches the details from the UnitCategories master table
      },
    });

    // Extract unitCategory, filter out nulls, and remove duplicates based on ID
    const msmeYears = records
      .map((r) => r.msmeYear)
      .filter((cat) => cat !== null);

    // Use a Map to ensure uniqueness by ID
    const uniqueCategories = [
      ...new Map(msmeYears.map((item) => [item.id, item])).values(),
    ];

    return uniqueCategories;
  }
  async getFinancialParametersByPolicy(policyId: number) {
    const records = await this.prisma.kyiIcCalculator.findMany({
      where: {
        policy_id: policyId,
        isActive: true,
      },
      select: {
        financialParameter: true, // Fetches details from m_financial_parameter
      },
    });

    // Extract financialParameter, filter out nulls
    const parameters = records
      .map((r) => r.financialParameter)
      .filter((param) => param !== null);

    // Remove duplicates based on ID using a Map
    const uniqueParameters = [
      ...new Map(parameters.map((item) => [item.id, item])).values(),
    ];

    return uniqueParameters;
  }

    private calculateIncentives(rows: any[], financialParams: any) {
    // Map parameter IDs to values (e.g., financial_parameter_5 -> 5: 100000)
    const mappingIdToInvestment: Record<number, number> = {};
    for (const [key, value] of Object.entries(financialParams)) {
      const mappingId = Number(key.replace("financial_parameter_", ""));
      mappingIdToInvestment[mappingId] = Number(value);
    }

    return rows.map((r) => {
      const mappingId = Number(r.incentive_mapping_id);
      const investment = mappingIdToInvestment[mappingId] || 0;

      const percent = r.benefit_percent_amount ? Number(r.benefit_percent_amount) : null;
      const cap = r.cap_limit ? Number(r.cap_limit) : null;

      let incentive_amount: number | string = "";

      if (percent !== null && cap !== null) {
        incentive_amount = Math.min((investment * percent) / 100, cap);
      } else if (cap === null && percent !== null) {
        incentive_amount = (investment * percent) / 100;
      } else if (cap !== null && percent === null) {
        incentive_amount = cap;
      }

      return {
        policy_name: r.policy?.policy_name, // Accessing from Prisma include
        incentive_name: r.incentiveType?.name, 
        benefit_percent_amount: r.benefit_percent_amount,
        cap_limit: r.cap_limit,
        eligibility_notes: r.eligibility_notes,
        incentive_amount,
      };
    });
  }

async filterICDetails(query: any) {
  const { policy_id, financial_parameters, ...filters } = query;

  if (!financial_parameters || Object.keys(financial_parameters).length === 0) {
    throw new Error("financial_parameters is required");
  }
  const policyIdNum = Number(policy_id);
  if (isNaN(policyIdNum)) {
    throw new Error("policy_id must be a number");
  }
  const mappingIds = Object.keys(financial_parameters)
    .map((key) => Number(key.replace("financial_parameter_", "")));

  const filterFields = [
    'unit_type_value',
    'sector_value',
    'msme_year_value',
    'sub_sector_value',
    'unit_category_value',
    'land_type_value',
    'block_value',
    'beneficiary_type_value',
    'anchor_unit_value',
  ];

  // Initial base conditions
  const whereConditions: any = {
    policy_id: policyIdNum ,
    incentive_mapping_id: { in: mappingIds },
    isActive: true,
  };

  // Build the "Match OR Null" logic using AND + OR
  filterFields.forEach((field) => {
    const userValue = filters[field];
    if (userValue !== undefined && userValue !== null && userValue !== "") {
      // Correct Prisma way: field must be userValue OR field must be NULL
      whereConditions[field] = {
        equals: Number(userValue),
      };
      
      // We use an explicit OR for each field to allow for the 'Universal' (NULL) values
      whereConditions['OR'] = [
        ...(whereConditions['OR'] || []),
        { [field]: Number(userValue) },
        { [field]: null }
      ];
      
      // Remove the direct assignment to avoid conflict with the OR block
      delete whereConditions[field];
    }
  });

  // Since nested ORs can get messy, here is the cleaner, flat approach:
  const finalWhere: any = {
    AND: [
      { policy_id: policyIdNum },
      { incentive_mapping_id: { in: mappingIds } },
      { isActive: true },
    ]
  };

  filterFields.forEach((field) => {
    const userValue = filters[field];
    if (userValue !== undefined && userValue !== null && userValue !== "") {
      finalWhere.AND.push({
        OR: [
          { [field]: Number(userValue) },
          { [field]: null }
        ]
      });
    }
  });

  const records = await this.prisma.kyiIcCalculator.findMany({
    where: finalWhere,
    include: {
      policy: true,
      incentiveType: true,
    },
  });

  return this.calculateIncentives(records, financial_parameters);
}

  async compareICDetails(query: any) {
    const { financial_parameters, ...rest } = query;

    // Extract all policy_id_1, policy_id_2, etc.
    const policyIds = Object.keys(rest)
      .filter((key) => key.startsWith("policy_id_"))
      .map((key) => rest[key])
      .filter((id) => id !== null && id !== "");

    if (policyIds.length === 0) throw new Error("At least one policy is required");

    const output: any = {};

    // Process each policy sequentially to build the comparison object
    for (let i = 0; i < policyIds.length; i++) {
      const policyIdNum = Number(policyIds[i]);
      if (isNaN(policyIdNum)) throw new Error(`policy_id_${i+1} must be a number`);

      const result = await this.filterICDetails({
        ...query,
        policy_id: policyIdNum, // now it’s a number
      });
      output[`policy_${i + 1}_result`] = result;
    }


    return output;
  }

}
