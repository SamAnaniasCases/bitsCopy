
import jwt from 'jsonwebtoken';

async function main() {
    const employeesUrl = 'http://localhost:3001/api/employees';
    const secret = 'your-secret-key-change-this-in-production';

    try {
        console.log('Synthesizing token...');
        const token = jwt.sign({ id: 1, email: 'admin@bits.com', role: 'ADMIN' }, secret, { expiresIn: '1h' });

        console.log('Fetching employees with synthesized token...');
        const res = await fetch(employeesUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('Response Status:', res.status, res.statusText);

        const contentType = res.headers.get('content-type');
        console.log('Content-Type:', contentType);

        if (contentType && contentType.includes('application/json')) {
            const data = await res.json();
            console.log('API Response:', JSON.stringify(data, null, 2));
        } else {
            const txt = await res.text();
            console.log('API Response (Text):', txt);
        }

    } catch (error) {
        console.error('Script error:', error);
    }
}

main();
