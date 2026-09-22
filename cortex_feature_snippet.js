/**
 * ============================================================================
 * Cortex AI Integration Snippet for qualifier.html
 * ============================================================================
 * 
 * Drop this script tag (or paste the code below) into your qualifier.html file
 * to enable real-time Cortex LLM-powered qualification, fit scoring, and pitch generation.
 *
 * HOW TO USE IN qualifier.html:
 * 1. Add a button in your HTML:
 *    <button id="cortex-btn" onclick="runCortexQualification()">🤖 Analyze Opportunity with Cortex AI</button>
 *
 * 2. Add an output container in your HTML:
 *    <div id="cortex-results-panel" style="display:none; margin-top: 1.5rem; padding: 1.5rem; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px;"></div>
 *
 * 3. Include this JavaScript:
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
        <span>Querying Snowflake Cortex AI model (Claude 3.5 Sonnet)...</span>
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
        model: 'claude-3-5-sonnet' // or 'llama3.1-70b'
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
