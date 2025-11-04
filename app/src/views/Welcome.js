import React from 'react';
import { Link } from 'react-router-dom';

import PageTitle from '../components/PageTitle';
import Pricings from '../components/Pricings';

const Welcome = () => {
	return (
		<>
			<PageTitle />
			<header className="navbar">
				<nav className="navbar-container">
					<Link className="logo" to="/" title="Readdig.com">
						<img src="/favicons/logo.png" alt="" />
					</Link>
					<ul className="navbar-nav">
						<li>
							<Link to="/login" className="btn">
								Login
							</Link>
						</li>
						<li>
							<Link to="/signup" className="btn primary">
								Signup
							</Link>
						</li>
					</ul>
				</nav>
			</header>
			<section className="jumbotron">
				<h1>A PWA platform RSS reader and podcasts player.</h1>
				<p>
					Using RSS subscribe your news sites, blogs, Weibo, YouTube, X, and
					newsletters, etc.
				</p>
				<Link to="/signup" className="btn primary">
					START TRIAL
				</Link>
			</section>
			<section className="features">
				<div className="screenshot">
					<img src="/static/screenshot.png" alt="screenshot" />
				</div>
			</section>
			<Pricings />
			<footer className="footer">© Readdig.com</footer>
		</>
	);
};

export default Welcome;
