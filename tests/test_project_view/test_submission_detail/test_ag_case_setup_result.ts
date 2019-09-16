import { config, mount, Wrapper } from '@vue/test-utils';

import * as ag_cli from 'ag-client-typescript';
import * as sinon from 'sinon';

import AGCaseSetupResult from '@/components/project_view/submission_detail/ag_case_setup_result.vue';

import * as data_ut from '@/tests/data_utils';

beforeAll(() => {
    config.logModifiedComponents = false;
});

describe('AGCaseSetupResult tests', () => {
    let wrapper: Wrapper<AGCaseSetupResult>;
    let submission: ag_cli.Submission;
    let ag_test_suite_result: ag_cli.AGTestSuiteResultFeedback;
    let group: ag_cli.Group;
    let user: ag_cli.User;

    let get_ag_test_suite_result_setup_stdout_stub: sinon.SinonStub;
    let get_ag_test_suite_result_setup_stderr_stub: sinon.SinonStub;

    beforeEach(() => {
        user = data_ut.make_user();
        group = data_ut.make_group(1, 1, {member_names: [user.username]});
        submission = data_ut.make_submission(group);
        ag_test_suite_result = data_ut.make_ag_test_suite_result_feedback(1);

        get_ag_test_suite_result_setup_stdout_stub = sinon.stub(
            ag_cli.ResultOutput, 'get_ag_test_suite_result_setup_stdout'
        ).returns(
            Promise.resolve("hi")
        );
        get_ag_test_suite_result_setup_stderr_stub = sinon.stub(
            ag_cli.ResultOutput, 'get_ag_test_suite_result_setup_stderr'
        ).returns(
            Promise.resolve("bye")
        );
    });

    afterEach(() => {
        sinon.restore();

        if (wrapper.exists()) {
            wrapper.destroy();
        }
    });

    test('show_setup_stdout === false', async () => {
        wrapper = mount(AGCaseSetupResult, {
            propsData: {
                ag_test_suite_result: ag_test_suite_result,
                submission: submission,
                fdbk_category: ag_cli.FeedbackCategory.max
            }
        });
        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_ag_test_suite_result!.fdbk_settings.show_setup_stdout).toBe(false);
        expect(wrapper.find('#stdout-section').exists()).toBe(false);
    });

    test('setup_stdout === null && show_setup_stdout === true', async () => {
        ag_test_suite_result.fdbk_settings.show_setup_stdout = true;

        get_ag_test_suite_result_setup_stdout_stub.onFirstCall().returns(Promise.resolve(null));

        wrapper = mount(AGCaseSetupResult, {
            propsData: {
                ag_test_suite_result: ag_test_suite_result,
                submission: submission,
                fdbk_category: ag_cli.FeedbackCategory.max
            }
        });
        for (let i = 0; i < 3; ++i) {
            await wrapper.vm.$nextTick();
        }
        expect(wrapper.vm.d_ag_test_suite_result!.fdbk_settings.show_setup_stdout).toBe(true);
        expect(get_ag_test_suite_result_setup_stdout_stub.calledOnce).toBe(true);
        expect(wrapper.vm.d_setup_stdout).toEqual(null);
        expect(wrapper.find('#stdout-section').exists()).toBe(true);
        expect(wrapper.find('#stdout-section').text()).toContain("No Output");
    });

    test('setup_stderr === null && show_setup_stderr === true', async () => {
        ag_test_suite_result.fdbk_settings.show_setup_stderr = true;

        get_ag_test_suite_result_setup_stderr_stub.onFirstCall().returns(
            Promise.resolve(null)
        );

        wrapper = mount(AGCaseSetupResult, {
            propsData: {
                ag_test_suite_result: ag_test_suite_result,
                submission: submission,
                fdbk_category: ag_cli.FeedbackCategory.max
            }
        });
        for (let i = 0; i < 3; ++i) {
            await wrapper.vm.$nextTick();
        }

        expect(wrapper.vm.d_ag_test_suite_result!.fdbk_settings.show_setup_stderr).toBe(true);
        expect(wrapper.find('#stderr-section').text()).toContain("No Output");
    });

    test('setup_stdout === not null and show_setup_stdout === true', async () => {
        ag_test_suite_result.fdbk_settings.show_setup_stdout = true;

        wrapper = mount(AGCaseSetupResult, {
            propsData: {
                ag_test_suite_result: ag_test_suite_result,
                submission: submission,
                fdbk_category: ag_cli.FeedbackCategory.max
            }
        });
        for (let i = 0; i < 3; ++i) {
            await wrapper.vm.$nextTick();
        }

        expect(wrapper.vm.d_ag_test_suite_result!.fdbk_settings.show_setup_stdout).toBe(true);
        expect(wrapper.find('#stdout-section').text()).toContain("hi");
    });

    test('show_setup_stderr === false', async () => {
        wrapper = mount(AGCaseSetupResult, {
            propsData: {
                ag_test_suite_result: ag_test_suite_result,
                submission: submission,
                fdbk_category: ag_cli.FeedbackCategory.max
            }
        });
        for (let i = 0; i < 3; ++i) {
            await wrapper.vm.$nextTick();
        }

        expect(wrapper.vm.d_ag_test_suite_result!.fdbk_settings.show_setup_stderr).toBe(false);
        expect(wrapper.find('#stderr-section').exists()).toBe(false);
    });

    test('setup_stderr === not null and show_setup_stderr === true', async () => {
        ag_test_suite_result.fdbk_settings.show_setup_stderr = true;

        wrapper = mount(AGCaseSetupResult, {
            propsData: {
                ag_test_suite_result: ag_test_suite_result,
                submission: submission,
                fdbk_category: ag_cli.FeedbackCategory.max
            }
        });
        for (let i = 0; i < 3; ++i) {
            await wrapper.vm.$nextTick();
        }

        expect(wrapper.vm.d_ag_test_suite_result!.fdbk_settings.show_setup_stderr).toBe(true);
        expect(wrapper.find('#stderr-section').text()).toContain("bye");
    });

    test('show_setup_stdout === true', async () => {
        ag_test_suite_result.fdbk_settings.show_setup_stdout = true;

        wrapper = mount(AGCaseSetupResult, {
            propsData: {
                ag_test_suite_result: ag_test_suite_result,
                submission: submission,
                fdbk_category: ag_cli.FeedbackCategory.max
            }
        });
        for (let i = 0; i < 3; ++i) {
            await wrapper.vm.$nextTick();
        }

        expect(wrapper.vm.d_ag_test_suite_result!.fdbk_settings.show_setup_stdout).toBe(true);
        expect(wrapper.find('#stdout-section').exists()).toBe(true);
    });

    test('show_setup_stdout === false', async () => {
        wrapper = mount(AGCaseSetupResult, {
            propsData: {
                ag_test_suite_result: ag_test_suite_result,
                submission: submission,
                fdbk_category: ag_cli.FeedbackCategory.max
            }
        });
        for (let i = 0; i < 3; ++i) {
            await wrapper.vm.$nextTick();
        }

        expect(wrapper.vm.d_ag_test_suite_result!.fdbk_settings.show_setup_stdout).toBe(false);
        expect(wrapper.find('#stdout-section').exists()).toBe(false);
    });

    test('show_setup_stderr === true', async () => {
        ag_test_suite_result.fdbk_settings.show_setup_stderr = true;

        wrapper = mount(AGCaseSetupResult, {
            propsData: {
                ag_test_suite_result: ag_test_suite_result,
                submission: submission,
                fdbk_category: ag_cli.FeedbackCategory.max
            }
        });
        for (let i = 0; i < 3; ++i) {
            await wrapper.vm.$nextTick();
        }

        expect(wrapper.vm.d_ag_test_suite_result!.fdbk_settings.show_setup_stderr).toBe(true);
        expect(wrapper.find('#stderr-section').exists()).toBe(true);
    });

    test('show_setup_stderr === false', async () => {
        wrapper = mount(AGCaseSetupResult, {
            propsData: {
                ag_test_suite_result: ag_test_suite_result,
                submission: submission,
                fdbk_category: ag_cli.FeedbackCategory.max
            }
        });
        for (let i = 0; i < 3; ++i) {
            await wrapper.vm.$nextTick();
        }

        expect(wrapper.vm.d_ag_test_suite_result!.fdbk_settings.show_setup_stderr).toBe(false);
        expect(wrapper.find('#stderr-section').exists()).toBe(false);
    });

    test('setup command timed out', async () => {
        ag_test_suite_result.setup_timed_out = true;

        wrapper = mount(AGCaseSetupResult, {
            propsData: {
                ag_test_suite_result: ag_test_suite_result,
                submission: submission,
                fdbk_category: ag_cli.FeedbackCategory.max
            }
        });
        for (let i = 0; i < 3; ++i) {
            await wrapper.vm.$nextTick();
        }

        expect(wrapper.find('#exit-status-section').text()).toContain("Timed Out");
    });

    test('Exit status is displayed', async () => {
        ag_test_suite_result.setup_timed_out = false;
        ag_test_suite_result.setup_return_code = 0;

        wrapper = mount(AGCaseSetupResult, {
            propsData: {
                ag_test_suite_result: ag_test_suite_result,
                submission: submission,
                fdbk_category: ag_cli.FeedbackCategory.max
            }
        });
        for (let i = 0; i < 3; ++i) {
            await wrapper.vm.$nextTick();
        }

        expect(wrapper.find('#exit-status-section').text()).toContain("0");
    });
});

describe('AGCaseSetupResult setup_exit_status tests', () => {
    let wrapper: Wrapper<AGCaseSetupResult>;
    let submission: ag_cli.Submission;
    let ag_test_suite_result: ag_cli.AGTestSuiteResultFeedback;
    let group: ag_cli.Group;
    let user: ag_cli.User;

    let get_ag_test_suite_result_setup_stdout_stub: sinon.SinonStub;
    let get_ag_test_suite_result_setup_stderr_stub: sinon.SinonStub;

    beforeEach(() => {
        user = data_ut.make_user();
        group = data_ut.make_group(1, 1, {member_names: [user.username]});
        submission = data_ut.make_submission(group);
        ag_test_suite_result = data_ut.make_ag_test_suite_result_feedback(1);

        get_ag_test_suite_result_setup_stdout_stub = sinon.stub(
            ag_cli.ResultOutput, 'get_ag_test_suite_result_setup_stdout'
        ).returns(
            Promise.resolve("hi")
        );
        get_ag_test_suite_result_setup_stderr_stub = sinon.stub(
            ag_cli.ResultOutput, 'get_ag_test_suite_result_setup_stderr'
        ).returns(
            Promise.resolve("bye")
        );

        wrapper = mount(AGCaseSetupResult, {
            propsData: {
                ag_test_suite_result: ag_test_suite_result,
                submission: submission,
                fdbk_category: ag_cli.FeedbackCategory.max
            }
        });
    });

    afterEach(() => {
        sinon.restore();

        if (wrapper.exists()) {
            wrapper.destroy();
        }
    });

    test('setup_exit_status - setup_timed_out === null && setup_return_code === null', () => {
        expect(wrapper.vm.d_ag_test_suite_result!.setup_timed_out).toBeNull();
        expect(wrapper.vm.d_ag_test_suite_result!.setup_return_code).toBeNull();
        expect(wrapper.vm.setup_exit_status).toEqual("Not Available");
    });

    test('setup_exit_status - setup_timed_out === false && setup_return_code === null', () => {
        wrapper.vm.d_ag_test_suite_result!.setup_timed_out = false;

        expect(wrapper.vm.d_ag_test_suite_result!.setup_timed_out).toBe(false);
        expect(wrapper.vm.d_ag_test_suite_result!.setup_return_code).toBeNull();
        expect(wrapper.vm.setup_exit_status).toEqual("Not Available");
    });

    test('setup_exit_status - setup_timed_out === true && setup_return_code === null',  () => {
        wrapper.vm.d_ag_test_suite_result!.setup_timed_out = true;

        expect(wrapper.vm.d_ag_test_suite_result!.setup_timed_out).toBe(true);
        expect(wrapper.vm.d_ag_test_suite_result!.setup_return_code).toBeNull();
        expect(wrapper.vm.setup_exit_status).toEqual("Timed Out");
    });

    test('setup_exit_status - setup_timed_out === null && setup_return_code !== null',  () => {
        wrapper.vm.d_ag_test_suite_result!.setup_return_code = 1;

        expect(wrapper.vm.d_ag_test_suite_result!.setup_timed_out).toBeNull();
        expect(wrapper.vm.d_ag_test_suite_result!.setup_return_code).toBe(1);
        expect(wrapper.vm.setup_exit_status).toEqual(1);
    });
});


describe('AGCaseSetupResult tests concerning Watchers', () => {
    let wrapper: Wrapper<AGCaseSetupResult>;
    let submission: ag_cli.Submission;
    let ag_test_suite_result: ag_cli.AGTestSuiteResultFeedback;
    let group: ag_cli.Group;
    let user: ag_cli.User;

    let get_ag_test_suite_result_setup_stdout_stub: sinon.SinonStub;
    let get_ag_test_suite_result_setup_stderr_stub: sinon.SinonStub;

    beforeEach(() => {
        user = data_ut.make_user();
        group = data_ut.make_group(1, 1, {member_names: [user.username]});
        submission = data_ut.make_submission(group);
        ag_test_suite_result = data_ut.make_ag_test_suite_result_feedback(1);

        get_ag_test_suite_result_setup_stdout_stub = sinon.stub(
            ag_cli.ResultOutput, 'get_ag_test_suite_result_setup_stdout'
        );
        get_ag_test_suite_result_setup_stderr_stub = sinon.stub(
            ag_cli.ResultOutput, 'get_ag_test_suite_result_setup_stderr'
        );

        get_ag_test_suite_result_setup_stdout_stub.onFirstCall().returns(Promise.resolve(null));
        get_ag_test_suite_result_setup_stdout_stub.onSecondCall().returns(Promise.resolve('hi'));

        get_ag_test_suite_result_setup_stderr_stub.onFirstCall().returns(Promise.resolve(null));
        get_ag_test_suite_result_setup_stderr_stub.onSecondCall().returns(Promise.resolve('bye'));

        wrapper = mount(AGCaseSetupResult, {
            propsData: {
                ag_test_suite_result: ag_test_suite_result,
                submission: submission,
                fdbk_category: ag_cli.FeedbackCategory.max
            }
        });
    });
    test('submission Watcher', async () => {
        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_submission).toEqual(submission);
        expect(get_ag_test_suite_result_setup_stdout_stub.calledOnce).toBe(true);
        expect(get_ag_test_suite_result_setup_stderr_stub.calledOnce).toBe(true);

        let updated_submission = data_ut.make_submission(group);
        wrapper.setProps({submission: updated_submission});
        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();

        expect(submission).not.toEqual(updated_submission);
        expect(wrapper.vm.d_submission).toEqual(updated_submission);
        expect(get_ag_test_suite_result_setup_stdout_stub.calledTwice).toBe(true);
        expect(get_ag_test_suite_result_setup_stderr_stub.calledTwice).toBe(true);
    });

    test('ag_test_suite_result Watcher', async () => {
        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_ag_test_suite_result).toEqual(ag_test_suite_result);
        expect(get_ag_test_suite_result_setup_stdout_stub.calledOnce).toBe(true);
        expect(get_ag_test_suite_result_setup_stderr_stub.calledOnce).toBe(true);

        let updated_ag_test_suite_result = data_ut.make_ag_test_suite_result_feedback(1);
        wrapper.setProps({ag_test_suite_result: updated_ag_test_suite_result});
        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();

        expect(ag_test_suite_result).not.toEqual(updated_ag_test_suite_result);
        expect(wrapper.vm.d_ag_test_suite_result).toEqual(updated_ag_test_suite_result);
        expect(get_ag_test_suite_result_setup_stdout_stub.calledTwice).toBe(true);
        expect(get_ag_test_suite_result_setup_stderr_stub.calledTwice).toBe(true);
    });

    test('fdbk_category Watcher', async () => {
        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_fdbk_category).toEqual(ag_cli.FeedbackCategory.max);
        expect(get_ag_test_suite_result_setup_stdout_stub.calledOnce).toBe(true);
        expect(get_ag_test_suite_result_setup_stderr_stub.calledOnce).toBe(true);

        wrapper.setProps({fdbk_category: ag_cli.FeedbackCategory.normal});
        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.d_fdbk_category).toEqual(ag_cli.FeedbackCategory.normal);
        expect(get_ag_test_suite_result_setup_stdout_stub.calledTwice).toBe(true);
        expect(get_ag_test_suite_result_setup_stderr_stub.calledTwice).toBe(true);
    });
});
