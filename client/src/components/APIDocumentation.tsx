import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function APIDocumentation() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>API Documentation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mt-4 p-4 bg-gray-50 rounded-md">
          <h4 className="text-md font-semibold text-gray-700">Verify Key</h4>
          <p className="mt-1 text-sm text-gray-500">Use this endpoint to verify a key from your application.</p>
          
          <div className="mt-4">
            <h5 className="text-sm font-semibold text-gray-700">POST /api/verify</h5>
            <pre className="mt-2 bg-gray-800 text-white p-3 rounded-md overflow-auto text-xs"><code>{`{
  "key": "YOUR-LICENSE-KEY",
  "hwid": "DEVICE-HARDWARE-ID"
}`}</code></pre>
          </div>
          
          <div className="mt-4">
            <h5 className="text-sm font-semibold text-gray-700">Response (Success)</h5>
            <pre className="mt-2 bg-gray-800 text-white p-3 rounded-md overflow-auto text-xs"><code>{`{
  "status": "success",
  "message": "Key verified successfully",
  "data": {
    "game": "PUBG MOBILE",
    "deviceLimit": 2,
    "devicesUsed": 1,
    "expiryDate": "2023-12-31"
  }
}`}</code></pre>
          </div>
          
          <div className="mt-4">
            <h5 className="text-sm font-semibold text-gray-700">Response (Error)</h5>
            <pre className="mt-2 bg-gray-800 text-white p-3 rounded-md overflow-auto text-xs"><code>{`{
  "status": "error",
  "message": "Invalid key or device limit reached"
}`}</code></pre>
          </div>
          
          <div className="mt-6">
            <h4 className="text-md font-semibold text-gray-700">Check Key Status</h4>
            <p className="mt-1 text-sm text-gray-500">Get information about a key without registering a device.</p>
            
            <div className="mt-4">
              <h5 className="text-sm font-semibold text-gray-700">GET /api/key-status/:key</h5>
            </div>
            
            <div className="mt-4">
              <h5 className="text-sm font-semibold text-gray-700">Response</h5>
              <pre className="mt-2 bg-gray-800 text-white p-3 rounded-md overflow-auto text-xs"><code>{`{
  "status": "success",
  "data": {
    "isValid": true,
    "game": "PUBG MOBILE",
    "deviceLimit": 2,
    "devicesUsed": 1,
    "expiryDate": "2023-12-31"
  }
}`}</code></pre>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
