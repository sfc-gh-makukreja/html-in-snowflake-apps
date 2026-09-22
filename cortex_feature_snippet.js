/**
 * ============================================================================
 * Cortex AI Integration Snippets for qualifier.html
 * ============================================================================
 * 
 * This file contains the two ways to integrate Snowflake Cortex AI into any qualifier HTML:
 * 1. Transcript Analysis (Conversational / Notes Analysis)
 * 2. Full Deal Qualification (Questionnaire Answers + Context)
 */

// ============================================================================
// Pattern 1: Meeting Transcript / Notes Analysis (Used in datacom-qualifier.html)
// ============================================================================

/**
 * Sends meeting notes or call transcript to Snowflake Cortex COMPLETE (Claude Sonnet 5)
 * @param {string} transcriptText - Raw conversation text or notes
 * @returns {Promise<string|null>} - Formatted AI analysis or null on error
 */
async function analyzeTranscriptWithCortex(transcriptText) {
  if (!transcriptText || !transcriptText.trim()) return null;

  try {
    const response = await fetch('/api/cortex/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: `You are an executive sales engineer. Briefly analyze this customer conversation transcript for Data & AI opportunity fit (3-4 sentences highlighting: 1. Main Data/AI Pain Points, 2. Recommended Solution Pitch, 3. Qualification Recommendation):\n\n${transcriptText}`,
        model: 'claude-sonnet-5'
      })
    });

    const data = await response.json();
    if (data.success) {
      return data.response;
    }
    console.warn('Cortex API returned failure:', data.error);
    return null;
  } catch (err) {
    console.error('Cortex transcript analysis network error:', err);
    return null;
  }
}


// ============================================================================
// Pattern 2: Full Opportunity & Questionnaire Qualification
// ============================================================================

/**
 * Runs end-to-end deal qualification including structured answers and prospect notes
 * @param {Object} answers - Map of questionnaire answers (e.g. { dataVolume: '10TB+', currentCloud: 'AWS' })
 * @param {string} prospectNotes - Free-text notes
 */
async function runCortexQualification(customAnswers = null, customNotes = null) {
  const btn = document.getElementById('cortex-btn');
  const resultsPanel = document.getElementById('cortex-results-panel');

  if (btn) {
    btn.disabled = true;
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = `⏳ Analyzing with Cortex AI...`;
  }

  if (resultsPanel) {
    resultsPanel.style.display = 'block';
    resultsPanel.innerHTML = `
      <div style="display:flex; align-items:center; gap: 0.75rem; color: #475569;">
        <div style="border: 3px solid #cbd5e1; border-top: 3px solid #29b5e8; border-radius: 50%; width: 20px; height: 20px; animation: spin 1s linear infinite;"></div>
        <span>Querying Snowflake Cortex AI model (Claude Sonnet 5)...</span>
      </div>
      <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
    `;
  }

  // Gather questionnaire responses from page if not explicitly passed
  const answers = customAnswers || collectQualifierAnswers();
  const notes = customNotes || (document.getElementById('prospect-notes')?.value || 'No additional notes provided.');

  try {
    const response = await fetch('/api/cortex/qualify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answers: answers,
        prospectNotes: notes,
        model: 'claude-sonnet-5' // or 'llama3.1-70b'
      })
    });

    const data = await response.json();

    if (data.success && resultsPanel) {
      // Basic formatting of Markdown response
      const formattedHtml = data.analysis
        .replace(/^### (.*$)/gim, '<h4 style="color:#0f172a; margin-top:1rem; margin-bottom:0.25rem;">$1</h4>')
        .replace(/^## (.*$)/gim, '<h3 style="color:#0f172a; margin-top:1.25rem; margin-bottom:0.5rem;">$1</h3>')
        .replace(/^# (.*$)/gim, '<h2 style="color:#0f172a; margin-top:1.5rem; margin-bottom:0.5rem;">$1</h2>')
        .replace(/\*\*(.*?)\*\*/g, '<strong style="color:#1e293b;">$1</strong>')
        .replace(/\n\n/g, '<br/><br/>')
        .replace(/^\* (.*$)/gim, '<li style="margin-left: 1.5rem;">$1</li>');

      resultsPanel.innerHTML = `
        <div style="border-bottom: 2px solid #29b5e8; padding-bottom: 0.5rem; margin-bottom: 1rem; display:flex; justify-content:space-between; align-items:center;">
          <h3 style="margin:0; color:#0f172a; display:flex; align-items:center; gap:0.5rem;">
            ❄️ Cortex AI Deal Intelligence
          </h3>
          <span style="font-size:0.75rem; background:#e0f2fe; color:#0369a1; padding: 2px 8px; border-radius: 12px; font-weight:600;">
            ${data.model}
          </span>
        </div>
        <div style="line-height: 1.6; color: #334155; font-size: 0.95rem;">
          ${formattedHtml}
        </div>
      `;
    } else if (resultsPanel) {
      resultsPanel.innerHTML = `<div style="color: #dc2626; font-weight: 500;">❌ Cortex AI Error: ${data.error || 'Unknown error occurred'}</div>`;
    }
  } catch (err) {
    console.error('Cortex request failed:', err);
    if (resultsPanel) {
      resultsPanel.innerHTML = `<div style="color: #dc2626; font-weight: 500;">❌ Network/API Error: ${err.message}</div>`;
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = btn.dataset.originalText || '🤖 Analyze Opportunity with Cortex AI';
    }
  }
}

// Fallback helper to harvest inputs / checkboxes from page
function collectQualifierAnswers() {
  const result = {};
  document.querySelectorAll('input:checked, select, textarea').forEach(el => {
    const key = el.name || el.id || 'unnamed_field';
    result[key] = el.value;
  });
  return result;
}
