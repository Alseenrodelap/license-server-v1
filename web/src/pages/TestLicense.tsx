import React, { useState } from 'react';
import { Card, CardBody, Input, Button, FormField } from '../components/ui';
import { CheckCircleIcon, XCircleIcon, EnvelopeIcon, ShieldCheckIcon, ClockIcon } from '@heroicons/react/24/outline';

const API = (import.meta as any).env?.VITE_API_URL || 'http://localhost:4000';

interface VerificationResult {
	valid: boolean;
	reason?: string;
	requiresVerification?: boolean;
	licenseId?: string;
	message?: string;
	license?: {
		id: string;
		code: string;
		customerName: string;
		customerEmail: string;
		domain: string;
		type: string;
		status: string;
		expiresAt: string;
		isCryptographic: boolean;
		requiresEmailVerification: boolean;
		emailVerifiedAt: string | null;
	};
}

export default function TestLicense() {
	const [licenseCode, setLicenseCode] = useState('');
	const [customerEmail, setCustomerEmail] = useState('');
	const [result, setResult] = useState<VerificationResult | null>(null);
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
	const [lastRequestTime, setLastRequestTime] = useState<number>(0);

	const handleVerify = async () => {
		if (!licenseCode.trim()) {
			setMessage({ text: 'Voer een licentiecode in', type: 'error' });
			return;
		}

		setLoading(true);
		setResult(null);
		setMessage(null);
		setLastRequestTime(Date.now());

		try {
			const response = await fetch(`${API}/licenses/verify`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					licenseCode: licenseCode.trim(),
					customerEmail: customerEmail.trim() || undefined
				})
			});

			const data = await response.json();
			setResult(data);

			if (data.valid) {
				setMessage({ text: 'Licentie is geldig!', type: 'success' });
			} else if (data.requiresVerification) {
				setMessage({ 
					text: data.message || 'Verificatie e-mail verzonden. Controleer uw inbox.', 
					type: 'info' 
				});
			} else {
				setMessage({ text: data.reason || 'Licentie is ongeldig', type: 'error' });
			}
		} catch (error) {
			setMessage({ text: 'Er ging iets mis bij het verifiëren van de licentie', type: 'error' });
		} finally {
			setLoading(false);
		}
	};

	const handleEmailVerification = async (token: string) => {
		setLoading(true);
		setMessage(null);

		try {
			const response = await fetch(`${API}/licenses/verify-email/${token}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});

			const data = await response.json();

			if (response.ok) {
				setMessage({ text: 'E-mail succesvol geverifieerd! U kunt nu uw licentie verifiëren.', type: 'success' });
				// Toon licentie details na verificatie
				if (data.license) {
					setResult({
						valid: true,
						license: {
							...data.license,
							isCryptographic: false,
							requiresEmailVerification: false,
							emailVerifiedAt: new Date().toISOString()
						}
					});
				}
			} else {
				setMessage({ text: data.error || 'E-mail verificatie mislukt', type: 'error' });
			}
		} catch (error) {
			setMessage({ text: 'Er ging iets mis bij de e-mail verificatie', type: 'error' });
		} finally {
			setLoading(false);
		}
	};

	// Check voor verificatie token in URL
	React.useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		const token = urlParams.get('token');
		if (token) {
			handleEmailVerification(token);
		}
	}, []);

	return (
		<div className="min-h-screen bg-white dark:bg-zinc-900 flex items-center justify-center p-4">
			<div className="w-full max-w-2xl">
				<Card>
					<CardBody>
						<div className="text-center mb-6">
							<h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
								Licentie Verificatie Test
							</h1>
							<p className="text-gray-600 dark:text-gray-400">
								Test het verifiëren van licentiecodes en zie wat er wordt teruggegeven
							</p>
						</div>

						{/* Rate Limiting Indicator */}
						{lastRequestTime > 0 && (
							<div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
								<div className="flex items-center space-x-2">
									<ClockIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
									<span className="text-sm text-yellow-800 dark:text-yellow-200">
										Rate limiting actief: 10 seconden tussen verzoeken
									</span>
								</div>
							</div>
						)}

						{/* Form */}
						<div className="space-y-4 mb-6">
							<FormField label="Licentiecode">
								<Input
									type="text"
									value={licenseCode}
									onChange={(e) => setLicenseCode(e.target.value)}
									placeholder="Voer licentiecode in..."
									className="font-mono"
								/>
							</FormField>

							<FormField label="Klant E-mail (optioneel, vereist voor cryptografische licenties)">
								<Input
									type="email"
									value={customerEmail}
									onChange={(e) => setCustomerEmail(e.target.value)}
									placeholder="klant@example.com"
								/>
							</FormField>

							<Button
								onClick={handleVerify}
								disabled={loading || !licenseCode.trim()}
								className="w-full"
							>
								{loading ? 'Verifiëren...' : 'Verificeer Licentie'}
							</Button>
						</div>

						{/* Messages */}
						{message && (
							<div className={`mb-4 p-4 rounded-lg ${
								message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' :
								message.type === 'error' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' :
								'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
							}`}>
								<div className="flex items-center space-x-2">
									{message.type === 'success' && <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />}
									{message.type === 'error' && <XCircleIcon className="h-5 w-5 text-red-600 dark:text-red-400" />}
									{message.type === 'info' && <EnvelopeIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
									<span className={`text-sm ${
										message.type === 'success' ? 'text-green-800 dark:text-green-200' :
										message.type === 'error' ? 'text-red-800 dark:text-red-200' :
										'text-blue-800 dark:text-blue-200'
									}`}>
										{message.text}
									</span>
								</div>
							</div>
						)}

						{/* Result Display */}
						{result && (
							<div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
								<h3 className="font-semibold text-gray-900 dark:text-white mb-3">API Response:</h3>
								<pre className="text-xs bg-white dark:bg-gray-900 p-3 rounded border overflow-x-auto">
									{JSON.stringify(result, null, 2)}
								</pre>
							</div>
						)}

						{/* License Details */}
						{result?.valid && result.license && (
							<div className="mt-6 bg-white dark:bg-gray-800 rounded-lg p-4 border">
								<h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
									<ShieldCheckIcon className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
									Licentie Details
								</h3>
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
									<div>
										<strong>Code:</strong> <span className="font-mono">{result.license.code}</span>
									</div>
									<div>
										<strong>Status:</strong> <span className={`px-2 py-1 rounded text-xs ${
											result.license.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
											'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
										}`}>
											{result.license.status}
										</span>
									</div>
									<div>
										<strong>Klant:</strong> {result.license.customerName}
									</div>
									<div>
										<strong>E-mail:</strong> {result.license.customerEmail}
									</div>
									<div>
										<strong>Domein:</strong> {result.license.domain}
									</div>
									<div>
										<strong>Type:</strong> {result.license.type}
									</div>
									<div>
										<strong>Vervaldatum:</strong> {result.license.expiresAt ? new Date(result.license.expiresAt).toLocaleDateString() : 'Geen'}
									</div>
									<div>
										<strong>Cryptografisch:</strong> {result.license.isCryptographic ? 'Ja' : 'Nee'}
									</div>
									<div>
										<strong>E-mail verificatie:</strong> {result.license.requiresEmailVerification ? 'Vereist' : 'Niet vereist'}
									</div>
									{result.license.emailVerifiedAt && (
										<div>
											<strong>Geverifieerd op:</strong> {new Date(result.license.emailVerifiedAt).toLocaleString()}
										</div>
									)}
								</div>
							</div>
						)}
					</CardBody>
				</Card>
			</div>
		</div>
	);
}
