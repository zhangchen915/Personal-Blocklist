import React from 'react';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import Snackbar from '@material-ui/core/Snackbar';
import Button from '@material-ui/core/Button';
import SaveIcon from '@material-ui/icons/Save';

export class Config extends React.Component {
    constructor(props, context) {
        super(props, context);

        this.state = {
            autoUpdate: true,
            domains: '',
            snackbarOpen: false,
            snackbarMsg: ''
        };
    }

    handleChange = name => event => {
        this.setState({[name]: event.target.value});
    };

    bulkAdd() {
        if (!this.state.domains) return;
        this.props.db.bulkAdd(this.state.domains.split('\n').filter(e => !!e).map(e => ({domain: e}))).then(() => {
            this.setState({
                domains: '',
                snackbarOpen: true,
                snackbarMsg: ''
            });
        }).catch('BulkError', err => {
        });
    }

    render() {
        return (
            <div style={{ padding: 20 }}>
               <FormControl fullWidth>
                    <InputLabel htmlFor="import-domain">导入域名</InputLabel>
                    <Input
                        id="import-domain"
                        placeholder="每行一个域名"
                        multiline={true}
                        rows={10}
                        onChange={this.handleChange('domains')}
                    />
                    <Button variant="contained" onClick={() => {
                        this.bulkAdd()
                    }}>
                        <SaveIcon/>保存
                    </Button>
                </FormControl>

                <Snackbar
                    anchorOrigin={{ vertical: 'top', horizontal: 'center'}}
                    open={this.state.snackbarOpen}
                    autoHideDuration={1500}
                    onClose={()=>{this.setState({snackbarOpen: false})}}
                    message={this.state.snackbarMsg || '保存成功'}
                />
            </div>
        )
    }
}