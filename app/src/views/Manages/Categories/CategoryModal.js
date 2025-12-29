import React, { useState, useEffect } from 'react';
import ReactModal from 'react-modal';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

import { createCategory, updateCategory } from '../../../api/category';
import IconPicker from '../../../components/IconPicker';

const CategoryModal = ({ category, isOpen, closeModal, onEnd }) => {
	const { t } = useTranslation();
	const [submitting, setSubmitting] = useState(false);
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [icon, setIcon] = useState('');
	const [color, setColor] = useState('');
	const [sort, setSort] = useState(0);

	useEffect(() => {
		if (category) {
			setName(category.name || '');
			setDescription(category.description || '');
			setIcon(category.icon || '');
			setColor(category.color || '');
			setSort(category.sort || 0);
		} else {
			setName('');
			setDescription('');
			setIcon('');
			setColor('');
			setSort(0);
		}
	}, [category, isOpen]);

	const onClose = () => {
		toast.dismiss();
		setSubmitting(false);
		closeModal();
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!name.trim()) {
			toast.error(t('Name is required'));
			return;
		}

		if (!icon.trim()) {
			toast.error(t('Icon is required'));
			return;
		}

		if (!color.trim()) {
			toast.error(t('Color is required'));
			return;
		}

		try {
			toast.dismiss();
			setSubmitting(true);
			const data = { name, description, icon, color, sort };
			if (category) {
				await updateCategory(category.id, data);
				toast.success(t('Category updated'));
			} else {
				await createCategory(data);
				toast.success(t('Category created'));
			}
			setSubmitting(false);
			onClose();
			onEnd && onEnd();
		} catch (err) {
			setSubmitting(false);
			toast.error(err.response?.data || t('Failed to save category'));
		}
	};

	if (!isOpen) return null;

	return (
		<ReactModal
			ariaHideApp={false}
			className="modal"
			isOpen={true}
			onRequestClose={onClose}
			overlayClassName="modal-overlay"
			shouldCloseOnOverlayClick={false}
		>
			<header>
				<h1>{category ? t('Edit category') : t('Add category')}</h1>
			</header>
			<section>
				<form onSubmit={handleSubmit}>
					<div className="form-group required">
						<label>{t('Name')}</label>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							placeholder={t('Category name')}
							autoFocus
						/>
					</div>
					<div className="form-group">
						<label>{t('Description')}</label>
						<textarea
							value={description}
							onChange={(e) => setDescription(e.target.value)}
							placeholder={t('Category description')}
							rows={3}
						/>
					</div>
					<div className="form-group required">
						<label>{t('Icon')}</label>
						<IconPicker value={icon} onChange={setIcon} />
					</div>
					<div className="form-group required">
						<label>{t('Color')}</label>
						<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
							<input
								type="color"
								value={color || '#3b82f6'}
								onChange={(e) => setColor(e.target.value)}
								style={{
									width: '40px',
									height: '34px',
									padding: '2px',
									cursor: 'pointer',
									flexShrink: 0,
								}}
							/>
							<input
								type="text"
								value={color}
								onChange={(e) => setColor(e.target.value)}
								placeholder="#3b82f6"
								style={{ flex: 1 }}
							/>
						</div>
					</div>
					<div className="form-group">
						<label>{t('Sort order')}</label>
						<input
							type="number"
							value={sort}
							onChange={(e) => setSort(parseInt(e.target.value) || 0)}
							placeholder="0"
						/>
					</div>
					<div className="buttons">
						<button type="submit" className="btn primary" disabled={submitting}>
							{submitting ? t('Saving...') : t('Save')}
						</button>
						<button
							type="button"
							className="btn link cancel"
							onClick={onClose}
							disabled={submitting}
						>
							{t('Cancel')}
						</button>
					</div>
				</form>
			</section>
		</ReactModal>
	);
};

export default CategoryModal;
