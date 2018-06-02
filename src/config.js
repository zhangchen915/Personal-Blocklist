import React from 'react';
import Checkbox from 'material-ui/Checkbox';
import { FormGroup, FormControlLabel } from 'material-ui/Form';

import {getStorage} from './data'

export class Config extends React.Component {
    constructor(props, context) {
        super(props, context);

        this.state = {
            autoUpdate: true,
        };

        this.initData()
    }

    initData() {
        getStorage('config').then(value => {
                for (let name in value) {
                    if (value.hasOwnProperty(name)) this.setState({[name]: value.name})
                }
            }
        )
    }

    handleChange = name => event => {
        this.setState({ [name]: event.target.checked });
    };


    render() {
        const {classes} = this.props;
        const {autoUpdate} = this.state;

        return (
            <FormGroup>
                <FormControlLabel
                    control={
                        <Checkbox
                            value="autoUpdate"
                            checked={autoUpdate}
                            onChange={this.handleChange}/>
                    }
                    label="自动更新"
                />

            </FormGroup>
        )
    }
}