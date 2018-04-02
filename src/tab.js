import React from 'react';
import { withStyles } from 'material-ui/styles';
import AppBar from 'material-ui/AppBar';
import Tabs, { Tab } from 'material-ui/Tabs';
import Typography from 'material-ui/Typography';

import EnhancedTable from  './table';

function TabContainer(props) {
    return (
        <Typography component="div" style={{ padding: 8 * 3 }}>
            {props.children}
        </Typography>
    );
}

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
        this.setState({ value });
    };

    render() {
        const { classes } = this.props;
        const { value } = this.state;

        return (
            <div className={classes.root}>
                <AppBar position="static">
                    <Tabs value={value} onChange={this.handleChange}>
                        <Tab label="屏蔽管理" />
                        <Tab label="设置" />
                        <Tab label="关于" />
                    </Tabs>
                </AppBar>
                {value === 0 && <EnhancedTable />}
                {value === 1 && <TabContainer></TabContainer>}
                {value === 2 && <TabContainer></TabContainer>}
            </div>
        );
    }
}

export default withStyles(styles)(SimpleTabs);