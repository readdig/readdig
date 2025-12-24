import React, { useState } from 'react';
import classNames from 'classnames';
import ReactModal from 'react-modal';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';
import { IconX } from '@tabler/icons-react';

import FolderSelect from '../Folders/FolderSelect';
import FeedAutocomplete from './FeedAutocomplete';
import { addFeed } from '../../api/feed';
import { followFeed } from '../../api/follow';

const AddFeedModal = ({ isOpen = false, isRedirect = true, closeModal }) => {
	const dispatch = useDispatch();
	const history = useHistory();
	const { t } = useTranslation();
	const [feed, setFeed] = useState();
	const [folder, setFolder] = useState();
	const [submitting, setSubmitting] = useState(false);
	const { handleSubmit } = useForm();

	const onClose = () => {
		toast.dismiss();
		setFeed();
		setFolder();
		setSubmitting(false);
		closeModal();
	};

	const onSubmit = async () => {
		if (!feed) return;

		try {
			toast.dismiss();
			setSubmitting(true);
			if (feed.feedUrl) {
				const res = await addFeed(feed.feedUrl);
				const feedId = res.data.id;
				const folderId = folder ? folder.value : null;
				await followFeed(dispatch, feedId, folderId);
				onClose();
				const feedPath = feedId ? '/feed/' + feedId : '';
				const folderPath = folderId ? '/folder/' + folderId : '';
				isRedirect && history.push(`${folderPath}${feedPath}`);
			}
			if (feed.feedId) {
				const feedId = feed.feedId;
				const folderId = folder ? folder.value : null;
				await followFeed(dispatch, feedId, folderId);
				onClose();
				const feedPath = feedId ? '/feed/' + feedId : '';
				const folderPath = folderId ? '/folder/' + folderId : '';
				isRedirect && history.push(`${folderPath}${feedPath}`);
			}
		} catch (err) {
			setSubmitting(false);
		}
	};

	return (
		isOpen && (
			<ReactModal
				className="modal"
				isOpen={true}
				ariaHideApp={false}
				onRequestClose={onClose}
				overlayClassName="modal-overlay"
				shouldCloseOnOverlayClick={true}
			>
				<header>
					<h1>{t('Add feed')}</h1>
					<span className="exit" onClick={onClose}>
						<IconX />
					</span>
				</header>
				<form onSubmit={handleSubmit(onSubmit)}>
					<div className={classNames('form-group', 'required')}>
						<label>{t('Feed URL')}</label>
						<FeedAutocomplete onChange={setFeed} />
						<div className="note">
							{t(
								'Enter a feed URL (http or https), supports RSS Feed and JSON Feed sources.',
							)}
						</div>
					</div>
					<div className="form-group">
						<label>
							{t('Folder')}
							<span className="note">({t('optional')})</span>
						</label>
						<FolderSelect placeholder={t('Search folders')} onChange={setFolder} />
						<div className="note">{t('Enter a name to search for folders.')}</div>
					</div>
					<div className="buttons">
						<button type="submit" className="btn primary" disabled={submitting || !feed}>
							{t('Add')}
						</button>
						<button type="button" className="btn link cancel" onClick={onClose}>
							{t('Cancel')}
						</button>
					</div>
				</form>
			</ReactModal>
		)
	);
};

export default AddFeedModal;
