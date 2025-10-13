import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { withServiceWorkerUpdater } from '@3m1/service-worker-updater';

const Updater = ({ newServiceWorkerDetected, onLoadNewServiceWorkerAccept }) => {
	const { t } = useTranslation();

	useEffect(() => {
		if (newServiceWorkerDetected) {
			toast(
				<div className="updater">
					<div>{t('A new version is available!')}</div>
					<div>
						<button onClick={onLoadNewServiceWorkerAccept}>{t('Update')}</button>
					</div>
				</div>,
				{
					toastId: 'updater',
					autoClose: false,
					hideProgressBar: true,
					closeOnClick: false,
					closeButton: false,
					pauseOnHover: false,
					draggable: false,
				},
			);
		}
	}, [t, newServiceWorkerDetected, onLoadNewServiceWorkerAccept]);

	return null;
};

export default withServiceWorkerUpdater(Updater);
