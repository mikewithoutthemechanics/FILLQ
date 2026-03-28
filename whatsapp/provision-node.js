/**
 * FillIQ WhatsApp Node Provisioning
 * 
 * Creates and configures a new OpenClaw node for a studio.
 * The node handles:
 *   - Receiving booking requests via WhatsApp
 *   - Parsing them with AI
 *   - Creating bookings in Supabase
 *   - Sending confirmations back
 * 
 * Usage: node provision-node.js --studio-id <id> --studio-name <name>
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const OPENCLAW_HOME = process.env.OPENCLAW_HOME || '/root/.openclaw';
const NODES_DIR = path.join(OPENCLAW_HOME, 'filliq-nodes');
const SUPABASE_URL = 'https://zlanegnamrsrphcvxtcf.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function provisionNode(studioId, studioName) {
  const nodeDir = path.join(NODES_DIR, studioId);
  const workspaceDir = path.join(nodeDir, 'workspace');

  // Create directories
  fs.mkdirSync(workspaceDir, { recursive: true });

  // AGENTS.md - instructs the node how to handle messages
  const agentsMd = `# FillIQ Booking Assistant

You are the booking assistant for ${studioName}.

## Your Job
When someone messages about booking a class, extract:
- Their name
- Class type (yoga, pilates, barre, reformer, etc.)
- Date and time
- Any special requests

Then:
1. Create the booking in Supabase
2. Confirm back: "✅ Booked! {class} on {date} at {time}. See you there! 🧘"
3. If the class is full, offer the waitlist

## Message Patterns to Watch For
- "Can I book yoga tomorrow at 9am?"
- "I'd like to reserve a spot for pilates Thursday"
- "Book me in for the 6pm vinyasa"
- "Is there space in the morning class?"
- Any message mentioning booking, reserving, or class times

## Response Style
- Warm, friendly, concise
- Use emoji naturally (🧘 ✅ 💪)
- Always confirm the details back
- If unclear, ask: "Just to confirm — you'd like to book {class} on {date} at {time}, right?"

## Handling Cancellations
If someone says they can't make it:
1. Mark their booking as cancelled
2. Trigger the waitlist fill
3. Reply: "No worries! I've cancelled your {class} booking. We'll fill the spot from the waitlist. 🙏"

## Edge Cases
- Unknown person: Ask for their name and create a member record
- No matching class: "I don't see a class at that time. Here are the upcoming classes: [list]"
- Double booking: "You're already booked for that class! ✅"
`;

  // SOUL.md - personality
  const soulMd = `# SOUL.md - ${studioName} Booking Bot

## Identity
- Name: ${studioName} Booking Assistant
- Vibe: Warm, helpful, efficient
- Emoji: 🧘

## Principles
- Be quick — booking should take 2 messages max
- Be warm — this is a wellness business
- Be accurate — always confirm details
- Be proactive — suggest alternatives when classes are full
`;

  // Config
  const config = {
    studio_id: studioId,
    studio_name: studioName,
    supabase_url: SUPABASE_URL,
    supabase_key: SUPABASE_SERVICE_KEY,
    channel: 'whatsapp',
    model: 'anthropic/claude-sonnet-4-20250514',
    created_at: new Date().toISOString(),
  };

  // OpenClaw config for this node
  const openclawConfig = {
    agent: {
      name: `${studioName} Booking Bot`,
      model: 'anthropic/claude-sonnet-4-20250514',
    },
    channels: {
      whatsapp: {
        enabled: true,
      }
    },
    workspace: workspaceDir,
    filliq: {
      studio_id: studioId,
      studio_name: studioName,
      supabase_url: SUPABASE_URL,
    }
  };

  // Write files
  fs.writeFileSync(path.join(workspaceDir, 'AGENTS.md'), agentsMd);
  fs.writeFileSync(path.join(workspaceDir, 'SOUL.md'), soulMd);
  fs.writeFileSync(path.join(workspaceDir, 'filliq-config.json'), JSON.stringify(config, null, 2));
  fs.writeFileSync(path.join(nodeDir, 'openclaw.json'), JSON.stringify(openclawConfig, null, 2));

  // HEARTBEAT.md - monitors for new messages
  const heartbeatMd = `# HEARTBEAT.md

# Check for pending booking requests
- Monitor incoming WhatsApp messages
- Parse booking intent
- Create booking in Supabase
- Send confirmation
`;
  fs.writeFileSync(path.join(workspaceDir, 'HEARTBEAT.md'), heartbeatMd);

  console.log(`✅ Node provisioned at: ${nodeDir}`);
  console.log(`📁 Workspace: ${workspaceDir}`);
  console.log(`🔑 Studio ID: ${studioId}`);
  console.log(`\nNext step: Start the node with:`);
  console.log(`  openclaw start --config ${nodeDir}/openclaw.json`);
  console.log(`\nThen scan the QR code to pair WhatsApp.`);

  return { nodeDir, workspaceDir, config };
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const getArg = (name) => {
    const idx = args.indexOf(`--${name}`);
    return idx !== -1 ? args[idx + 1] : null;
  };

  const studioId = getArg('studio-id');
  const studioName = getArg('studio-name');

  if (!studioId || !studioName) {
    console.log('Usage: node provision-node.js --studio-id <id> --studio-name <name>');
    process.exit(1);
  }

  provisionNode(studioId, studioName);
}

module.exports = { provisionNode };
