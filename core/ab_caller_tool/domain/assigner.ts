/**
 * Lead Assigner
 * 
 * Handles assignment of leads to test groups (A/B) based on configured strategies.
 * Supports random 1:1 assignment and stratified assignment.
 */

export type AssignmentMode = 'random_1_to_1' | 'stratified';

export type Lead = {
  lead_id: string;
  phone: string;
  sector?: string;
  province?: string;
};

export type AssignmentConfig = {
  mode: AssignmentMode;
  block_size?: number;
};

export type AssignmentResult = {
  lead_id: string;
  group: 'A' | 'B';
  assignment_reason: string;
  metadata?: Record<string, any>;
};

export type AssignmentStats = {
  total_leads: number;
  group_a_count: number;
  group_b_count: number;
  assignment_balance: number; // percentage difference between groups
};

export class LeadAssigner {
  private config: AssignmentConfig;
  private randomSeed?: number;

  constructor(config: AssignmentConfig, randomSeed?: number) {
    this.config = config;
    this.randomSeed = randomSeed;
  }

  /**
   * Assign leads to test groups
   */
  assignLeads(leads: Lead[]): AssignmentResult[] {
    switch (this.config.mode) {
      case 'random_1_to_1':
        return this.randomAssignment(leads);
      case 'stratified':
        return this.stratifiedAssignment(leads);
      default:
        throw new Error(`Unknown assignment mode: ${this.config.mode}`);
    }
  }

  /**
   * Random 1:1 assignment
   */
  private randomAssignment(leads: Lead[]): AssignmentResult[] {
    const results: AssignmentResult[] = [];
    let groupACount = 0;
    let groupBCount = 0;

    for (const lead of leads) {
      // Simple alternating assignment for 1:1 balance
      const group = groupACount <= groupBCount ? 'A' : 'B';
      
      results.push({
        lead_id: lead.lead_id,
        group,
        assignment_reason: `Random 1:1 assignment (A: ${groupACount}, B: ${groupBCount})`,
        metadata: {
          assignment_mode: 'random_1_to_1',
          lead_phone: lead.phone,
          lead_sector: lead.sector,
          lead_province: lead.province
        }
      });

      if (group === 'A') {
        groupACount++;
      } else {
        groupBCount++;
      }
    }

    return results;
  }

  /**
   * Stratified assignment based on lead characteristics
   */
  private stratifiedAssignment(leads: Lead[]): AssignmentResult[] {
    const results: AssignmentResult[] = [];
    const blockSize = this.config.block_size || 4;
    
    // Group leads by stratification criteria
    const stratifiedGroups = this.stratifyLeads(leads);
    
    for (const [stratum, stratumLeads] of stratifiedGroups.entries()) {
      // Assign within each stratum
      const stratumAssignments = this.assignWithinStratum(stratumLeads, blockSize);
      results.push(...stratumAssignments);
    }

    return results;
  }

  /**
   * Stratify leads based on characteristics
   */
  private stratifyLeads(leads: Lead[]): Map<string, Lead[]> {
    const strata = new Map<string, Lead[]>();

    for (const lead of leads) {
      // Create stratification key based on sector and province
      const stratumKey = `${lead.sector || 'unknown'}_${lead.province || 'unknown'}`;
      
      if (!strata.has(stratumKey)) {
        strata.set(stratumKey, []);
      }
      
      strata.get(stratumKey)!.push(lead);
    }

    return strata;
  }

  /**
   * Assign leads within a stratum
   */
  private assignWithinStratum(leads: Lead[], blockSize: number): AssignmentResult[] {
    const results: AssignmentResult[] = [];
    const blocks = this.createBlocks(leads, blockSize);
    
    for (const block of blocks) {
      const blockAssignments = this.assignBlock(block);
      results.push(...blockAssignments);
    }

    return results;
  }

  /**
   * Create blocks of leads for assignment
   */
  private createBlocks(leads: Lead[], blockSize: number): Lead[][] {
    const blocks: Lead[][] = [];
    
    for (let i = 0; i < leads.length; i += blockSize) {
      blocks.push(leads.slice(i, i + blockSize));
    }
    
    return blocks;
  }

  /**
   * Assign leads within a block
   */
  private assignBlock(leads: Lead[]): AssignmentResult[] {
    const results: AssignmentResult[] = [];
    
    // Shuffle leads within block for randomization
    const shuffledLeads = this.shuffleArray([...leads]);
    
    for (let i = 0; i < shuffledLeads.length; i++) {
      const lead = shuffledLeads[i];
      const group = i % 2 === 0 ? 'A' : 'B';
      
      results.push({
        lead_id: lead.lead_id,
        group,
        assignment_reason: `Stratified assignment within block (position ${i + 1})`,
        metadata: {
          assignment_mode: 'stratified',
          block_position: i + 1,
          lead_phone: lead.phone,
          lead_sector: lead.sector,
          lead_province: lead.province
        }
      });
    }

    return results;
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(this.getRandom() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
  }

  /**
   * Get random number (seeded if provided)
   */
  private getRandom(): number {
    if (this.randomSeed !== undefined) {
      // Simple seeded random number generator
      this.randomSeed = (this.randomSeed * 9301 + 49297) % 233280;
      return this.randomSeed / 233280;
    }
    
    return Math.random();
  }

  /**
   * Get assignment statistics
   */
  getAssignmentStats(assignments: AssignmentResult[]): AssignmentStats {
    const groupACount = assignments.filter(a => a.group === 'A').length;
    const groupBCount = assignments.filter(a => a.group === 'B').length;
    const totalLeads = assignments.length;
    
    const assignmentBalance = totalLeads > 0 
      ? Math.abs(groupACount - groupBCount) / totalLeads * 100 
      : 0;

    return {
      total_leads: totalLeads,
      group_a_count: groupACount,
      group_b_count: groupBCount,
      assignment_balance: assignmentBalance
    };
  }

  /**
   * Validate assignment configuration
   */
  validateConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.config.mode) {
      errors.push('Assignment mode is required');
    }

    if (this.config.mode === 'stratified' && !this.config.block_size) {
      errors.push('Block size is required for stratified assignment');
    }

    if (this.config.block_size && this.config.block_size < 2) {
      errors.push('Block size must be at least 2');
    }

    if (this.config.block_size && this.config.block_size % 2 !== 0) {
      errors.push('Block size must be even for balanced assignment');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Get assignment preview without actually assigning
   */
  previewAssignment(leads: Lead[]): {
    assignments: AssignmentResult[];
    stats: AssignmentStats;
    config: AssignmentConfig;
  } {
    const assignments = this.assignLeads(leads);
    const stats = this.getAssignmentStats(assignments);

    return {
      assignments,
      stats,
      config: this.config
    };
  }
}


