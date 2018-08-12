import React from 'react';
import Checkbox from '@material-ui/core/Checkbox';
import FormGroup from '@material-ui/core/FormGroup';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Input from '@material-ui/core/Input';

export class Config extends React.Component {
    constructor(props, context) {
        super(props, context);

        this.state = {
            autoUpdate: true,
        };
    }

    handleChange = name => event => {
        this.setState({ [name]: event.target.checked });
    };


    render() {
        const {classes} = this.props;
        const {autoUpdate} = this.state;

        return (
            <div>
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
                <FormControl fullWidth>
                    <InputLabel htmlFor="import-domain">导入域名</InputLabel>
                    <Input
                        id="import-domain"
                        placeholder="每行一个域名"
                        multiline={true}
                        rows={10}
                    />
                </FormControl>
            </div>
        )
    }
}