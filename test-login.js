const http = require('http');

async function run() {
  const loginUrl = 'http://hwenih.lvh.me:3000/api/auth/callback/credentials';
  
  // We need to fetch the CSRF token first
  const csrfRes = await fetch('http://hwenih.lvh.me:3000/api/auth/csrf');
  const csrfData = await csrfRes.json();
  const csrfCookie = csrfRes.headers.get('set-cookie');
  console.log('CSRF Token:', csrfData.csrfToken);
  
  const body = new URLSearchParams({
    csrfToken: csrfData.csrfToken,
    email: 'admin@tender.com',
    password: 'password', // I don't know the exact password, but we'll try
    json: 'true',
  });

  const res = await fetch(loginUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': csrfCookie,
    },
    body: body.toString(),
    redirect: 'manual'
  });

  const cookies = res.headers.get('set-cookie');
  console.log('Login Status:', res.status);
  console.log('Login Cookies:', cookies);
  
  if (cookies) {
    const sessionRes = await fetch('http://hwenih.lvh.me:3000/api/auth/session', {
      headers: {
        'Cookie': cookies
      }
    });
    console.log('Session Status:', sessionRes.status);
    const sessionText = await sessionRes.text();
    console.log('Session Body:', sessionText);
  }
}

run();
