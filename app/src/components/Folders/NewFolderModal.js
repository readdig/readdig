import React, { useState } from 'react';
import classNames from 'classnames';
import ReactModal from 'react-modal';
import { useDispatch } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import FeedSelect from '../Feeds/FeedSelect';
import { newFolder } from '../../api/folder';
import { getCollections } from '../../api/collection';

import { ReactComponent as ExitIcon } from '../../images/icons/close.svg';

const NewFolderModal = ({ isOpen = false, isRedirect = true, closeModal }) => {
	const dispatch = useDispatch();
	const { t } = useTranslation();
	const history = useHistory();
	const [feeds, setFeeds] = useState([]);
	const [submitting, setSubmitting] = useState(false);
	const { register, handleSubmit, errors } = useForm();

	const onClose = () => {
		toast.dismiss();
		setFeeds([]);
		setSubmitting(false);
		closeModal();
	};

	const onSubmit = async (data) => {
		try {
			toast.dismiss();
			setSubmitting(true);
			const feedIds = feeds.map((feed) => feed.id);
			const res = await newFolder(dispatch, { name: data.name, feedIds });
			await getCollections(dispatch);
			onClose();
			isRedirect && history.push(`/folder/${res.data.id}`);
		} catch (err) {
			setSubmitting(false);
		}
	};

	return (
		isOpen && (
			<ReactModal
				ariaHideApp={false}
				className="modal"
				isOpen={true}
				onRequestClose={onClose}
				overlayClassName="modal-overlay"
				shouldCloseOnOverlayClick={true}
			>
				<header>
					<h1>{t('New folder')}</h1>
					<span className="exit" onClick={onClose}>
						<ExitIcon />
					</span>
				</header>

				<form onSubmit={handleSubmit(onSubmit)}>
					<div className={classNames('form-group', 'required', { error: errors.name })}>
						<label>{t('Name')}</label>
						<input
							type="text"
							autoComplete="false"
							name="name"
							ref={register({ required: true })}
						/>
						<div className="note">{t('Enter a folder name.')}</div>
					</div>

					<div className="form-group">
						<label>
							{t('Feed')}
							<span className="note">({t('multiple selections')})</span>
						</label>
						<FeedSelect placeholder={t('Search feeds')} onChange={setFeeds} />
						<div className="note">{t('Enter a name to search for feeds.')}</div>
					</div>

					<div className="buttons">
						<button type="submit" className="btn primary" disabled={submitting}>
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

export default NewFolderModal;
