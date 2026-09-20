(function () {
  const CLASSES = [
    'Pharmacy',
    'Laboratory',
    'Billing',
    'Scheduling',
    'Immunizations',
    'Patient portal'
  ];

  const TRAIN = [
    ['Pharmacy', 'refill request for metformin ePrescribe surescripts medication allergy pharmacy rx'],
    ['Pharmacy', 'patient needs outpatient prescription sent to CVS eRx eligibility'],
    ['Pharmacy', 'controlled substance refill denied by pharmacy need new rx'],
    ['Pharmacy', 'medication list update warfarin dose change prescription'],
    ['Laboratory', 'external lab order Labcorp requisition specimen collection results'],
    ['Laboratory', 'CBC metabolic panel not resulting in the chart lab order'],
    ['Laboratory', 'imaging and lab orders pending specimen rejected'],
    ['Laboratory', 'send lab requisition PDF to external lab'],
    ['Billing', 'claim denied CPT ICD-10 insurance payment posting'],
    ['Billing', 'patient balance statement copay not collected billing'],
    ['Billing', 'resubmit rejected claim modifier missing CPT'],
    ['Billing', 'era posting failed for last week claims'],
    ['Scheduling', 'book follow up appointment with provider next Tuesday'],
    ['Scheduling', 'cancel overlapping resource and reschedule visit'],
    ['Scheduling', 'no show appointment slot still blocked scheduling'],
    ['Scheduling', 'front desk cannot find open slots this week'],
    ['Immunizations', 'childhood vaccine history missing from registry'],
    ['Immunizations', 'influenza shot administered need immunization record'],
    ['Immunizations', 'CVX code not mapping on immunization forecast'],
    ['Immunizations', 'update immunization registry after clinic administration'],
    ['Patient portal', 'patient cannot log into portal to see labs and rx'],
    ['Patient portal', 'portal message about records and prescriptions'],
    ['Patient portal', 'reset portal password so they can view results'],
    ['Patient portal', 'patient wants visit summary in the portal']
  ];

  const PHI = [
    { re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, label: 'email' },
    { re: /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}\b/g, label: 'phone' },
    { re: /\b\d{3}-\d{2}-\d{4}\b/g, label: 'ssn-like' },
    { re: /\b(?:0?[1-9]|1[0-2])[/-](?:0?[1-9]|[12]\d|3[01])[/-](?:19|20)\d{2}\b/g, label: 'date' },
    { re: /\b(?:19|20)\d{2}[-/](?:0?[1-9]|1[0-2])[-/](?:0?[1-9]|[12]\d|3[01])\b/g, label: 'date' },
    { re: /\b(?:mrn|patient id|member id)[:#\s-]*[A-Z0-9-]{4,}\b/gi, label: 'id' }
  ];

  function tokens(text) {
    return (text.toLowerCase().match(/[a-z][a-z0-9+]{1,}/g) || []).filter((w) => w.length > 2);
  }

  function train() {
    const df = Object.create(null);
    const classTf = Object.create(null);
    const classDocs = Object.create(null);
    CLASSES.forEach((c) => {
      classTf[c] = Object.create(null);
      classDocs[c] = 0;
    });
    TRAIN.forEach(([label, text]) => {
      classDocs[label] += 1;
      const seen = Object.create(null);
      tokens(text).forEach((t) => {
        classTf[label][t] = (classTf[label][t] || 0) + 1;
        if (!seen[t]) {
          df[t] = (df[t] || 0) + 1;
          seen[t] = 1;
        }
      });
    });
    return { df, classTf, classDocs, n: TRAIN.length };
  }

  const MODEL = train();

  function classify(text) {
    const bag = tokens(text);
    if (!bag.length) return [];
    const scores = CLASSES.map((label) => {
      let score = Math.log((MODEL.classDocs[label] + 1) / (MODEL.n + CLASSES.length));
      bag.forEach((t) => {
        const idf = Math.log((MODEL.n + 1) / ((MODEL.df[t] || 0) + 1)) + 1;
        const tf = (MODEL.classTf[label][t] || 0) + 0.1;
        score += tf * idf;
      });
      return { label, score };
    });
    const max = Math.max(...scores.map((s) => s.score));
    const exps = scores.map((s) => ({ ...s, p: Math.exp(s.score - max) }));
    const sum = exps.reduce((a, s) => a + s.p, 0);
    return exps
      .map((s) => ({ label: s.label, conf: s.p / sum }))
      .sort((a, b) => b.conf - a.conf);
  }

  function findPhi(text) {
    const hits = [];
    PHI.forEach(({ re, label }) => {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(text))) {
        hits.push({ start: m.index, end: m.index + m[0].length, label, value: m[0] });
      }
    });
    hits.sort((a, b) => a.start - b.start || b.end - a.end);
    const merged = [];
    hits.forEach((h) => {
      if (!merged.some((x) => h.start < x.end && h.end > x.start)) merged.push(h);
    });
    return merged;
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  function markPhi(text, hits) {
    if (!hits.length) return escapeHtml(text);
    let out = '';
    let i = 0;
    hits.forEach((h) => {
      out += escapeHtml(text.slice(i, h.start));
      out += `<mark class="phi" title="${escapeHtml(h.label)}">${escapeHtml(h.value)}</mark>`;
      i = h.end;
    });
    out += escapeHtml(text.slice(i));
    return out;
  }

  function bindTriage(root) {
    if (!root) return;
    const input = root.querySelector('[data-triage-input]');
    const run = root.querySelector('[data-triage-run]');
    const bars = root.querySelector('[data-triage-bars]');
    const phi = root.querySelector('[data-triage-phi]');
    const chips = root.querySelector('[data-triage-chips]');
    if (!input || !bars) return;

    const samples = [
      'Please refill metformin and send ePrescribe to the pharmacy.',
      'Labcorp requisition PDF is missing for the external CBC order.',
      'Claim denied — CPT and ICD-10 do not match on this visit.',
      'Patient cannot log into the portal to see lab results. Email jane@clinic.test DOB 03/12/2018.'
    ];

    if (chips && !chips.childElementCount) {
      samples.forEach((s) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = s.slice(0, 42) + (s.length > 42 ? '…' : '');
        b.addEventListener('click', () => {
          input.value = s;
          paint();
        });
        chips.appendChild(b);
      });
    }

    const paint = () => {
      const text = input.value.trim();
      const ranked = classify(text);
      bars.innerHTML = ranked.map((r, idx) => {
        const pct = Math.round(r.conf * 100);
        return `<div class="triage-bar${idx === 0 ? ' is-top' : ''}"><span>${r.label}</span><i style="--w:${pct}%"></i><b>${pct}%</b></div>`;
      }).join('');
      const hits = findPhi(text);
      if (phi) {
        phi.innerHTML = text
          ? (hits.length
            ? `<p>Possible PHI highlighted (${hits.length}) — do not paste real charts.</p>${markPhi(text, hits)}`
            : '<p>No obvious PHI patterns in this text.</p>')
          : '<p>Paste a ticket. A tiny in-browser classifier routes it to an EHR module.</p>';
      }
    };

    run?.addEventListener('click', paint);
    input.addEventListener('input', paint);
    if (input.value.trim()) paint();
  }

  window.bindTriage = bindTriage;
})();
