/* eslint-disable testing-library/no-container */
/* eslint-disable testing-library/no-node-access */
import '@testing-library/jest-dom'

import {render, screen} from '@testing-library/react'

import AnnualStats from '../../components/AnnualStats'
import { authFetch } from '../../utils/api'

jest.mock('../../utils/api', () => ({ authFetch: jest.fn() }))

const populatedTestData = {
    "total_walk_distance": 77.07190007395839,
    "total_run_distance": 46.8640017119976,
    "total_pack_distance": 12.5,
    "average_run_speed": "12:56",
    "average_walk_speed": "25:52",
    "first_name": "Ali",
    "distance_unit": "mile",
}

const newUserTestData = {
    "total_walk_distance": 0,
    "total_run_distance": 0,
    "total_pack_distance": 0,
    "average_run_speed": null,
    "average_walk_speed": null,
    "first_name": "Ali",
    "distance_unit": "mile",
}

const mockResponse = (data, ok = true) => authFetch.mockResolvedValue({ ok, status: ok ? 200 : 500, json: async () => data })

describe(("AnnualStats"), () => {
    afterEach(() => jest.clearAllMocks())

    test("handles new user", async () => {
        mockResponse(newUserTestData)
        render(<AnnualStats userId="123"/>)
        const cells = await screen.findAllByRole("cell")
        expect(cells[0]).toHaveTextContent("Total stroller run miles")
        expect(cells[1]).toHaveTextContent("0.00")
        expect(cells[2]).toHaveTextContent("Total stroller walk miles")
        expect(cells[3]).toHaveTextContent("0.00")
        expect(cells[4]).toHaveTextContent("Total pack miles")
        expect(cells[5]).toHaveTextContent("0.00")
        expect(cells[6]).toHaveTextContent("Average run pace with stroller")
        expect(cells[7]).toHaveTextContent("N/A")
        expect(cells[8]).toHaveTextContent("Average walk pace with stroller")
        expect(cells[9]).toHaveTextContent("N/A")
    })

    test("handles user with populated data", async () => {
        mockResponse(populatedTestData)
        render(<AnnualStats userId="123"/>)
        const cells = await screen.findAllByRole("cell")
        expect(cells[1]).toHaveTextContent("46.86")
        expect(cells[3]).toHaveTextContent("77.07")
        expect(cells[5]).toHaveTextContent("12.50")
        expect(cells[7]).toHaveTextContent("12:56 min/mile")
        expect(cells[9]).toHaveTextContent("25:52 min/mile")
        expect(screen.getByRole("heading", {name: "Annual stroller miles"})).toBeInTheDocument()
    })

    test("requests the current year", async () => {
        mockResponse(newUserTestData)
        render(<AnnualStats userId="123"/>)
        await screen.findAllByRole("cell")
        expect(authFetch).toHaveBeenCalledWith(`/me/activity-data/${new Date().getFullYear()}`)
    })

    test("handles loading", () => {
        authFetch.mockReturnValue(new Promise(() => {}))
        const {container} = render(<AnnualStats userId="123"/>)
        expect(container.getElementsByClassName("loading-spinner")).toHaveLength(1)
    })

    test("shows an error when the request fails", async () => {
        mockResponse(null, false)
        jest.spyOn(console, "error").mockImplementation(() => {})
        render(<AnnualStats userId="123"/>)
        expect(await screen.findByText("Couldn't load your stats. Try refreshing the page.")).toBeInTheDocument()
    })
})
