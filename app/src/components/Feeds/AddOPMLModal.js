import React, { useState } from 'react';
import ReactModal from 'react-modal';
import Dropzone from 'react-dropzone';
import classNames from 'classnames';
import { useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { useTranslation } from 'react-i18next';

import FolderSelect from '../../components/Folders/FolderSelect';
import { opmlUpload } from '../../api/opml';

import { ReactComponent as ExitIcon } from '../../images/icons/close.svg';

const AddOPMLModal = ({ isOpen = false, closeModal }) => {
	const dispatch = useDispatch();
	const { t } = useTranslation();
	const [url, setUrl] = useState();
	const [file, setFile] = useState();
	const [folder, setFolder] = useState();
	const [submitting, setSubmitting] = useState(false);

	const onClose = () => {
		toast.dismiss();
		setUrl();
		setFile();
		setFolder();
		setSubmitting(false);
		closeModal();
	};

	const onSubmit = async (e) => {
		e.preventDefault();

		try {
			toast.dismiss();
			setSubmitting(true);
			let fd = new FormData();
			if (url) {
				fd.append('url', url);
			}
			if (file) {
				fd.append('file', file);
			}
			if (folder && folder.value) {
				fd.append('folderId', folder.value);
			}
			await opmlUpload(dispatch, fd);
			onClose();
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
					<h1>{t('Import OPML file')}</h1>
					<span className="exit" onClick={onClose}>
						<ExitIcon />
					</span>
				</header>

				<form onSubmit={onSubmit}>
					<div className="form-group">
						<label>
							{t('Folder')}
							<span className="note">({t('optional')})</span>
						</label>
						<FolderSelect placeholder={t('Search folders')} onChange={setFolder} />
						<div className="note">
							{t(
								'Enter a name to search for folders, selecting a folder ignores the directory structure in OPML.',
							)}
						</div>
					</div>
					<div className="form-group">
						<label>{t('OPML URL')}</label>
						<input
							type="url"
							autoComplete="false"
							disabled={file || submitting}
							onChange={(e) => setUrl(e.target.value)}
						/>
						<div className="note">{t('Enter an OPML URL (http or https)')}</div>
					</div>
					<div className="form-group">
						<label>{t('OPML 文件')}</label>
						<Dropzone onDrop={(file) => setFile(file[0])} disabled={url || submitting}>
							{({ getRootProps, getInputProps }) => {
								return (
									<div
										{...getRootProps()}
										className={classNames('dropzone', { disabled: url })}
									>
										<input {...getInputProps()} />
										{file ? (
											<div>{file.name}</div>
										) : (
											<div className="dropzone-container">
												<button className="btn primary" type="button">
													{t('Select file')}
												</button>
												<span>{t('or drag the file here')}</span>
											</div>
										)}
									</div>
								);
							}}
						</Dropzone>
						<div className="note">{t('Upload an OPML file.')}</div>
					</div>
					<div className="buttons">
						<button
							type="submit"
							className="btn primary"
							disabled={!(file || url) || submitting}
						>
							{t('Import')}
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

export default AddOPMLModal;
