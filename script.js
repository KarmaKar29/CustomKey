(() => {
  const form = document.getElementById('password-form');
  const output = document.getElementById('password');
  const copyBtn = document.getElementById('copy-btn');
  const toggleBackendBtn = document.getElementById('toggleBackend');
  let useBackend = false;

  const charSets = {
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    numbers: '0123456789',
    special: '!@#$%^&*()-_=+[]{}|;:,.<>?/~`',
  };

  function sanitizeKeywords(input) {
    if (!input) return [];
    return input
      .split(/[\s,]+/)
      .map((w) => w.trim())
      .filter(Boolean);
  }

  function shuffleString(str) {
    const arr = str.split('');
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
  }

  function generatePasswordClientSide(options) {
    const { keywords, length, includeUppercase, includeNumbers, includeSpecial } = options;
    let availableChars = charSets.lowercase;
    if (includeUppercase) availableChars += charSets.uppercase;
    if (includeNumbers) availableChars += charSets.numbers;
    if (includeSpecial) availableChars += charSets.special;

    const cleanKeywords = keywords.map((k) => k.replace(/[^\w]/g, ''));

    let baseLength = length;
    const keywordsJoined = cleanKeywords.join('');

    baseLength = Math.max(0, length - keywordsJoined.length);

    let basePassword = '';
    for (let i = 0; i < baseLength; i++) {
      basePassword += availableChars.charAt(Math.floor(Math.random() * availableChars.length));
    }

    let combined = basePassword + keywordsJoined;
    combined = shuffleString(combined);
    if (combined.length > length) {
      combined = combined.slice(0, length);
    }
    return combined;
  }

  async function generatePasswordBackend(options) {
    try {
      const response = await fetch('/generate_password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(options)
      });
      if (!response.ok) {
        throw new Error('Network response error');
      }
      const data = await response.json();
      return data.password || '';
    } catch (err) {
      alert('Failed to generate password from backend. Using client-side fallback.');
      return generatePasswordClientSide(options);
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    copyBtn.disabled = true;
    const keywordsRaw = form.elements['keywords'].value;
    const length = parseInt(form.elements['length'].value, 10);
    const includeUppercase = document.getElementById('uppercase').checked;
    const includeNumbers = document.getElementById('numbers').checked;
    const includeSpecial = document.getElementById('special').checked;

    if (isNaN(length) || length < 6 || length > 64) {
      alert('Please enter a valid password length between 6 and 64.');
      return;
    }

    const keywords = sanitizeKeywords(keywordsRaw);

    const options = {
      keywords,
      length,
      include_uppercase: includeUppercase,
      include_numbers: includeNumbers,
      include_special: includeSpecial,
    };

    output.value = '';
    copyBtn.disabled = true;

    let password = '';
    if (useBackend) {
      password = await generatePasswordBackend(options);
    } else {
      password = generatePasswordClientSide({
        keywords,
        length,
        includeUppercase,
        includeNumbers,
        includeSpecial,
      });
    }
    output.value = password;
    copyBtn.disabled = false;
    copyBtn.focus();
  });

  copyBtn.addEventListener('click', () => {
    if (!output.value) return;
    output.select();
    output.setSelectionRange(0, 99999); // for mobile and desktop
    navigator.clipboard.writeText(output.value).then(() => {
      copyBtn.textContent = 'Copied!';
      setTimeout(() => {
        copyBtn.textContent = 'Copy';
      }, 1500);
    }).catch(() => {
      alert('Copy failed! Please copy manually.');
    });
  });

  toggleBackendBtn.addEventListener('click', () => {
    useBackend = !useBackend;
    toggleBackendBtn.setAttribute('aria-pressed', useBackend.toString());
    toggleBackendBtn.textContent = `Use Backend Generation: ${useBackend ? 'ON' : 'OFF'}`;
  });
})();
