import React from 'react';
import 'github-profile-card/dist/gh-profile-card'
import 'github-profile-card/dist/gh-profile-card.css'

export class About extends React.Component {
    componentDidMount() {
        new GitHubCard({
            username: 'zhangchen915',
            template: '#github-card',
            sortBy: 'stars',
            reposHeaderText: 'Most starred',
            maxRepos: 5
        }).init()
    }

    render() {
        return (
            <div style={{padding: 20}}>
                <div id="github-card"/>
            </div>
        );
    }
}