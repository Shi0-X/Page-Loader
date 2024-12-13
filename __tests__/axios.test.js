import axios from 'axios';

test('Verificar adaptador y configuración de Axios', async () => {
  const adapterName = axios.defaults.adapter?.name || 'default';
  console.log('Axios adapter in use:', adapterName);
  expect(adapterName).toBe('default');

  const testUrl = 'https://example.com';
  const response = await axios.get(testUrl);
  console.log('Axios request URL:', testUrl);
  console.log('Axios response status:', response.status);
  expect(response.status).toBe(200);
});
