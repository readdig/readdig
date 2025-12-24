import React from 'react';
import ReactLightbox from 'yet-another-react-lightbox';
import { Zoom } from 'yet-another-react-lightbox/plugins';
import { IconX } from '@tabler/icons-react';

const Lightbox = ({ isOpen = false, attribs = {}, closeModal }) => {
	return (
		<ReactLightbox
			open={isOpen}
			plugins={[Zoom]}
			close={closeModal}
			zoom={{ maxZoomPixelRatio: 2 }}
			slides={[{ src: attribs.src, alt: attribs.alt }]}
			carousel={{ finite: true }}
			controller={{ closeOnBackdropClick: true }}
			render={{
				buttonPrev: () => null,
				buttonNext: () => null,
				buttonZoomIn: () => null,
				buttonZoomOut: () => null,
				iconClose: () => <IconX className="yarl__icon" />,
			}}
		/>
	);
};

export default Lightbox;
