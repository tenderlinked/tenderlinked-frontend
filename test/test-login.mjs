// Use built in fetch

async function run() {
  const loginUrl = 'http://hwenih.lvh.me:3000/api/auth/callback/credentials';
  
  const csrfRes = await fetch('http://hwenih.lvh.me:3000/api/auth/csrf');
  const csrfData = await csrfRes.json();
  const csrfCookies = csrfRes.headers.get('set-cookie');
  console.log('CSRF Cookie:', csrfCookies);
  console.log('CSRF Token:', csrfData.csrfToken);
  
  const body = new URLSearchParams({
    csrfToken: csrfData.csrfToken,
    email: 'admin@tender.com', // Replace with real email if this fails
    password: 'password', // Replace with real password if this fails
    json: 'true',
  });

  const res = await fetch(loginUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': csrfCookies, // Pass the CSRF cookie
    },
    body: body.toString(),
    redirect: 'manual'
  });

  const cookies = res.headers.get('set-cookie');
  console.log('Login Status:', res.status);
  console.log('Login Location:', res.headers.get('location'));
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
