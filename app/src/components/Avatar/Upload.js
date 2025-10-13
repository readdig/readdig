import React, { useRef, useState } from 'react';
import Dropzone from 'react-dropzone';
import AvatarEditor from 'react-avatar-editor';
import { useTranslation } from 'react-i18next';

const Upload = ({
	style,
	value,
	width,
	height,
	border,
	borderRadius,
	onChange,
	onError,
}) => {
	const { t } = useTranslation();
	const [zoom, setZoom] = useState(1);
	const [image, setImage] = useState(value);
	const dropzoneRef = useRef();
	const avatarEditorRef = useRef();

	const handleDrop = (files) => {
		setImage(files[0]);
	};

	const handleCrop = () => {
		try {
			if (onChange) {
				const canvas = avatarEditorRef.current.getImageScaledToCanvas();
				onChange(image ? canvas.toDataURL() : '');
			}
		} catch (err) {
			if (onError) {
				onError(err.message);
			}
		}
	};

	const handleZoom = (event) => {
		const target = event.target;
		if (target instanceof HTMLInputElement) {
			setZoom(parseFloat(target.value));
			handleCrop();
		}
	};

	const openDialog = () => {
		if (dropzoneRef.current) {
			dropzoneRef.current.open();
		}
	};

	const clearImage = () => {
		setImage('');
		handleCrop();
	};

	return (
		<div className="avatar-upload" style={style}>
			<Dropzone
				noClick={true}
				noKeyboard={true}
				ref={dropzoneRef}
				accept="image/jpeg, image/png"
				onDrop={handleDrop}
			>
				{({ getRootProps, getInputProps }) => (
					<div {...getRootProps({ className: 'avatar-dropzone' })}>
						<input {...getInputProps()} />
						<AvatarEditor
							ref={avatarEditorRef}
							image={image}
							width={width || 128}
							height={height || 128}
							border={border || 10}
							rotate={0}
							color={[215, 219, 221, 0.6]}
							scale={zoom}
							borderRadius={borderRadius || 64}
							onLoadSuccess={handleCrop}
							onImageChange={handleCrop}
						/>
						<button className="upload-text" type="button" onClick={openDialog}>
							{t('Select image')}
						</button>
						<button className="upload-text" type="button" onClick={clearImage}>
							{t('Clear image')}
						</button>
					</div>
				)}
			</Dropzone>
			<div className="avatar-zoom">
				<input
					type="range"
					min="0.1"
					max="2"
					step="0.01"
					defaultValue={zoom}
					onChange={handleZoom}
				/>
			</div>
		</div>
	);
};

export default Upload;
