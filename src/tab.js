import React from 'react';
import {withStyles} from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';

import EnhancedTable from './table';
import {Config} from "./config";
import {About} from "./about";

const styles = theme => ({
    root: {
        flexGrow: 1,
        backgroundColor: theme.palette.background.paper,
    },
});

class SimpleTabs extends React.Component {
    state = {
        value: 0,
    };

    handleChange = (event, value) => {
        this.setState({value});
    };

    render() {
        const {classes} = this.props;
        const {value} = this.state;

        return (
            <div className={classes.root}>
                <AppBar position="static">
                    <Tabs value={value} onChange={this.handleChange}>
                        <Tab label="屏蔽管理"/>
                        <Tab label="设置"/>
                        <Tab label="关于"/>
                    </Tabs>
                </AppBar>
                {value === 0 && <EnhancedTable {...this.props}/>}
                {value === 1 && <Config {...this.props}/>}
                {value === 2 && <About {...this.props} />}
            </div>
        );
    }
}

export default withStyles(styles)(SimpleTabs);