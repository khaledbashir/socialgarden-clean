/**
 * AnythingLLM Workspace Configuration
 * Standardizes workspace management and ensures proper alignment
 */

export interface WorkspaceConfig {
  name: string;
  slug: string;
  purpose: 'generation' | 'dashboard' | 'client' | 'admin';
  description: string;
  prompt?: string;
}

export const WORKSPACE_CONFIG = {
  // Generation workspace for creating SOWs
  generation: {
    name: "SOW Generator",
    slug: "sow-generator",
    purpose: "generation" as const,
    description: "Workspace for generating Scopes of Work using The Architect prompt"
  },

  // Master dashboard for analytics
  dashboard: {
    name: "SOW Master Dashboard",
    slug: "sow-master-dashboard",
    purpose: "dashboard" as const,
    description: "Workspace for SOW analytics and master dashboard chat"
  },

  // Client-facing workspaces
  clientTemplate: {
    name: "Client Template",
    slug: "client-template",
    purpose: "client" as const,
    description: "Template for creating client-specific workspaces"
  }
};

/**
 * Get workspace configuration by type
 */
export function getWorkspaceConfig(type: keyof typeof WORKSPACE_CONFIG): WorkspaceConfig {
  return WORKSPACE_CONFIG[type];
}

/**
 * Get all workspace configurations
 */
export function getAllWorkspaceConfigs(): WorkspaceConfig[] {
  return Object.values(WORKSPACE_CONFIG);
}

/**
 * Validate workspace slug format
 */
export function validateWorkspaceSlug(slug: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!slug || slug.length === 0) {
    errors.push("Slug cannot be empty");
    return { isValid: false, errors };
  }

  if (slug.length > 50) {
    errors.push("Slug cannot exceed 50 characters");
  }

  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(slug)) {
    errors.push("Slug can only contain lowercase letters, numbers, and hyphens");
    errors.push("Slug must start and end with a letter or number");
  }

  // Check for reserved slugs
  const reservedSlugs = ['admin', 'api', 'auth', 'login', 'dashboard'];
  if (reservedSlugs.includes(slug)) {
    errors.push(`Slug '${slug}' is reserved and cannot be used`);
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Generate a client-specific workspace slug
 */
export function generateClientWorkspaceSlug(clientName: string): string {
  const base = clientName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  // Ensure it starts and ends with alphanumeric
  let slug = base.replace(/^-+|-+$/g, '');

  // Ensure it's not empty after cleaning
  if (slug.length === 0) {
    slug = 'client';
  }

  // Add client suffix
  slug = `${slug}-client`;

  // Validate and truncate if necessary
  const validation = validateWorkspaceSlug(slug);
  if (!validation.isValid) {
    // Use fallback if validation fails
    slug = 'client-project';
  }

  return slug;
}

/**
 * Workspace creation utility with error handling
 */
export async function createWorkspaceSafely(
  anythingLLMService: any,
  config: WorkspaceConfig,
  retries: number = 3
): Promise<{ success: boolean; workspace?: any; error?: string }> {
  try {
    const validation = validateWorkspaceSlug(config.slug);
    if (!validation.isValid) {
      return {
        success: false,
        error: `Invalid workspace slug: ${validation.errors.join(', ')}`
      };
    }

    console.log(`🏢 Creating workspace: ${config.name} (${config.slug})`);

    // Attempt to create workspace
    const workspace = await anythingLLMService.createWorkspace({
      name: config.name,
      slug: config.slug,
      prompt: config.prompt || `Workspace for ${config.description}`,
      overrides: {
        systemPrompt: config.prompt
      }
    });

    console.log(`✅ Workspace created successfully: ${config.slug}`);
    return { success: true, workspace };

  } catch (error) {
    console.error(`❌ Failed to create workspace ${config.slug}:`, error);

    if (retries > 0) {
      console.log(`🔄 Retrying... (${retries} attempts remaining)`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      return createWorkspaceSafely(anythingLLMService, config, retries - 1);
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Ensure all required workspaces exist
 */
export async function ensureRequiredWorkspaces(anythingLLMService: any): Promise<{
  success: boolean;
  results: { [key: string]: any };
}> {
  const results: { [key: string]: any } = {};

  for (const config of Object.values(WORKSPACE_CONFIG)) {
    // Skip template as it's not a real workspace
    if (config.slug === 'client-template') continue;

    const result = await createWorkspaceSafely(anythingLLMService, config);
    results[config.slug] = result;
  }

  const allSuccess = Object.values(results).every(r => r.success);

  return {
    success: allSuccess,
    results
  };
}

/**
 * Get workspace by purpose (utility function)
 */
export function getWorkspaceByPurpose(purpose: 'generation' | 'dashboard' | 'client'): WorkspaceConfig | null {
  for (const config of Object.values(WORKSPACE_CONFIG)) {
    if (config.purpose === purpose) {
      return config;
    }
  }
  return null;
}
